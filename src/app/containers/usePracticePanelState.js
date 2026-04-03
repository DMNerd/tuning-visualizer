import React, { useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";

import { usePracticeActions } from "@/hooks/usePracticeActions";
import { usePersistedPrefs } from "@/hooks/usePersistedPrefs";
import { useMetronomeEngine } from "@/hooks/useMetronomeEngine";
import { useRandomScale, RANDOMIZE_MODES } from "@/hooks/useRandomScale";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";

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
    usePersistedPrefs({
      storageKey: STORAGE_KEYS.METRONOME_PREFS,
      initial: metronomeDefaults,
      setterKeys: [
        "bpm",
        "timeSig",
        "subdivision",
        "countInEnabled",
        "autoAdvanceEnabled",
        "barsPerScale",
        "announceCountInBeforeChange",
      ],
      debounceMs: 300,
    });
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

  const randomize = useMemo(
    () => ({
      randomizeMode,
      setRandomizeMode,
      randomizeNow,
      randomizeFromHotkey,
    }),
    [randomizeMode, setRandomizeMode, randomizeNow, randomizeFromHotkey],
  );
  const metronome = useMemo(
    () => ({
      prefs: metronomePrefs,
      setters: metronomeSetters,
      engine: metronomeEngine,
      safeBarsPerScale,
      barsRemaining,
    }),
    [
      metronomePrefs,
      metronomeSetters,
      metronomeEngine,
      safeBarsPerScale,
      barsRemaining,
    ],
  );
  const reset = useMemo(
    () => ({ resetMetronomePrefs, resetPracticeCounters }),
    [resetMetronomePrefs, resetPracticeCounters],
  );

  // Canonical API: consume `metronome`, `randomize`, and `reset`.
  // `practiceActions` stays top-level because it is intentionally shared
  // by multiple domains (panel model + orchestration/hotkeys).
  return {
    metronome,
    randomize,
    reset,
    practiceActions,
  };
}

export function useMetronomeControlsSlice(practiceState) {
  const { metronome, practiceActions } = practiceState;
  return useMemo(
    () => ({
      setters: metronome.setters,
      actions: practiceActions,
    }),
    [metronome.setters, practiceActions],
  );
}
