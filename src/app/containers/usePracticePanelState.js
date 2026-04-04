import React, { useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useShallow } from "zustand/react/shallow";

import { usePracticeActions } from "@/hooks/usePracticeActions";
import { useMetronomeEngine } from "@/hooks/useMetronomeEngine";
import {
  useRandomScale,
  RANDOMIZE_MODES,
  formatRandomizedScaleAnnouncement,
} from "@/hooks/useRandomScale";
import {
  useMetronomePrefsStore,
  selectMetronomeHydrateWithDefaults,
  selectMetronomePrefs,
  selectMetronomeSetPrefs,
  selectMetronomeSetters,
} from "@/stores/useMetronomePrefsStore";

export default function usePracticePanelState({
  metronomeDefaults,
  randomizeConfig,
}) {
  const [randomizeMode, setRandomizeMode] = React.useState(
    RANDOMIZE_MODES.Both,
  );
  const {
    randomizeNow,
    randomizeFromHotkey,
    pickRandomizedScale,
    applyPickedScale,
  } = useRandomScale({
    ...randomizeConfig,
    mode: randomizeMode,
    throttleMs: 150,
  });

  const {
    metronomePrefs,
    setMetronomePrefs,
    metronomeSetters,
    hydrateWithDefaults,
  } = useMetronomePrefsStore(
    useShallow((state) => ({
      metronomePrefs: selectMetronomePrefs(state),
      setMetronomePrefs: selectMetronomeSetPrefs(state),
      metronomeSetters: selectMetronomeSetters(state),
      hydrateWithDefaults: selectMetronomeHydrateWithDefaults(state),
    })),
  );

  React.useEffect(() => {
    hydrateWithDefaults(metronomeDefaults);
  }, [hydrateWithDefaults, metronomeDefaults]);
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
  const pendingRandomizedScaleRef = React.useRef(null);
  const handleMetronomeBeat = useCallback(
    ({ beat }) => {
      if (beat !== 1 || !autoAdvanceEnabled) return;

      const nextBarsRemaining = Math.max(0, barsRemainingRef.current - 1);
      if (announceCountInBeforeChange && nextBarsRemaining === 1) {
        const pendingResult = pickRandomizedScale?.();
        pendingRandomizedScaleRef.current = pendingResult;

        const nextLabel = formatRandomizedScaleAnnouncement({
          result: pendingResult,
          mode: randomizeMode,
        });

        toast(
          nextLabel
            ? `Scale change on next downbeat: ${nextLabel}`
            : "Scale change on next downbeat",
          { id: "scale-change-countin" },
        );
      }

      if (nextBarsRemaining <= 0) {
        const pendingResult = pendingRandomizedScaleRef.current;

        if (pendingResult) {
          applyPickedScale?.(pendingResult);
        } else {
          randomizeNow?.();
        }

        pendingRandomizedScaleRef.current = null;
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
      applyPickedScale,
      pickRandomizedScale,
      randomizeMode,
      randomizeNow,
      safeBarsPerScale,
    ],
  );

  React.useEffect(() => {
    pendingRandomizedScaleRef.current = null;
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
