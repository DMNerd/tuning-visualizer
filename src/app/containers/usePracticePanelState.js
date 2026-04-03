import React, { useCallback } from "react";
import { toast } from "react-hot-toast";

import { usePracticeActions } from "@/hooks/usePracticeActions";
import { useMetronomePrefs } from "@/hooks/useMetronomePrefs";
import { useMetronomeEngine } from "@/hooks/useMetronomeEngine";
import { useRandomScale, RANDOMIZE_MODES } from "@/hooks/useRandomScale";

export default function usePracticePanelState({
  metronomeDefaults,
  randomizeConfig,
}) {
  const [randomizeMode, setRandomizeMode] = React.useState(
    RANDOMIZE_MODES.Both,
  );
  const { randomizeNow, randomizeFromHotkey } = useRandomScale({
    ...randomizeConfig,
    mode: randomizeMode,
    throttleMs: 150,
  });

  const [metronomePrefs, setMetronomePrefs, metronomeSetters] =
    useMetronomePrefs(metronomeDefaults);
  const {
    bpm,
    timeSig,
    subdivision,
    autoAdvanceEnabled,
    barsPerScale,
    announceCountInBeforeChange,
  } = metronomePrefs;

  const safeBarsPerScale = Math.max(1, Number(barsPerScale) || 1);
  const [barsRemaining, setBarsRemaining] = React.useState(safeBarsPerScale);
  const barsRemainingRef = React.useRef(safeBarsPerScale);
  const handleMetronomeBeat = useCallback(
    ({ beat }) => {
      if (beat !== 1 || !autoAdvanceEnabled) return;

      const nextBarsRemaining = Math.max(0, barsRemainingRef.current - 1);
      if (announceCountInBeforeChange && nextBarsRemaining === 1) {
        toast("Scale change on next downbeat", { id: "scale-change-countin" });
      }

      if (nextBarsRemaining <= 0) {
        randomizeNow?.();
        barsRemainingRef.current = safeBarsPerScale;
        setBarsRemaining(safeBarsPerScale);
        return;
      }

      barsRemainingRef.current = nextBarsRemaining;
      setBarsRemaining(nextBarsRemaining);
    },
    [
      announceCountInBeforeChange,
      autoAdvanceEnabled,
      randomizeNow,
      safeBarsPerScale,
    ],
  );

  React.useEffect(() => {
    barsRemainingRef.current = safeBarsPerScale;
    setBarsRemaining(safeBarsPerScale);
  }, [safeBarsPerScale, autoAdvanceEnabled]);

  const metronomeEngine = useMetronomeEngine({
    bpm,
    timeSig,
    subdivision,
    onBeat: handleMetronomeBeat,
  });

  const practiceActions = usePracticeActions({
    isPlaying: metronomeEngine.isPlaying,
    startMetronome: metronomeEngine.start,
    stopMetronome: metronomeEngine.stop,
    setBpm: metronomeSetters.setBpm,
    randomizeNow,
    randomizeFromHotkey,
  });

  const resetMetronomePrefs = useCallback(() => {
    setMetronomePrefs(metronomeDefaults);
  }, [metronomeDefaults, setMetronomePrefs]);

  const resetPracticeCounters = useCallback(() => {
    barsRemainingRef.current = metronomeDefaults.barsPerScale;
    setBarsRemaining(metronomeDefaults.barsPerScale);
    practiceActions.resetTapTempo();
  }, [metronomeDefaults.barsPerScale, practiceActions]);

  return {
    randomizeMode,
    setRandomizeMode,
    metronomePrefs,
    metronomeSetters,
    safeBarsPerScale,
    barsRemaining,
    metronomeEngine,
    practiceActions,
    randomizeNow,
    randomizeFromHotkey,
    resetMetronomePrefs,
    resetPracticeCounters,
  };
}
