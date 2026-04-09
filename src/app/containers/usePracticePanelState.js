import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useShallow } from "zustand/react/shallow";

import { usePracticeActions } from "@/hooks/usePracticeActions";
import { useMetronomePlayback } from "@/hooks/useMetronomeEngine";
import {
  useRandomScale,
  formatRandomizedScaleAnnouncement,
} from "@/hooks/useRandomScale";
import {
  useMetronomePrefsStore,
  selectMetronomeHydrateWithDefaults,
  selectMetronomePrefs,
  selectMetronomeRandomizeMode,
  selectMetronomeSetPrefs,
  selectMetronomeSetRandomizeMode,
  selectMetronomeSetters,
} from "@/stores/useMetronomePrefsStore";

export default function usePracticePanelState({
  metronomeDefaults,
  randomizeConfig,
}) {
  const { selectedRoot, selectedScale } = randomizeConfig;
  const {
    metronomePrefs,
    randomizeMode,
    setRandomizeMode,
    setMetronomePrefs,
    metronomeSetters,
    hydrateWithDefaults,
  } = useMetronomePrefsStore(
    useShallow((state) => ({
      metronomePrefs: selectMetronomePrefs(state),
      randomizeMode: selectMetronomeRandomizeMode(state),
      setRandomizeMode: selectMetronomeSetRandomizeMode(state),
      setMetronomePrefs: selectMetronomeSetPrefs(state),
      metronomeSetters: selectMetronomeSetters(state),
      hydrateWithDefaults: selectMetronomeHydrateWithDefaults(state),
    })),
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

  useEffect(() => {
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
  const [barsRemaining, setBarsRemaining] = useState(safeBarsPerScale);
  const barsRemainingRef = useRef(safeBarsPerScale);
  const pendingRandomizedScaleRef = useRef(null);
  const practiceStartSelectionRef = useRef(null);
  const randomizedDuringPracticeRef = useRef(false);
  const isPlayingRef = useRef(false);

  const capturePracticeStartSelection = useCallback(() => {
    if (practiceStartSelectionRef.current) return;
    practiceStartSelectionRef.current = {
      root: selectedRoot,
      scale: selectedScale,
    };
  }, [selectedRoot, selectedScale]);

  const markRandomizedDuringPractice = useCallback(() => {
    if (!isPlayingRef.current) return;
    capturePracticeStartSelection();
    randomizedDuringPracticeRef.current = true;
  }, [capturePracticeStartSelection]);

  const restorePracticeStartSelection = useCallback(() => {
    if (!randomizedDuringPracticeRef.current) return;

    const originalSelection = practiceStartSelectionRef.current;
    if (!originalSelection) return;

    if (
      typeof originalSelection.root === "string" &&
      originalSelection.root.length
    ) {
      randomizeConfig.setRoot?.(originalSelection.root);
    }
    if (
      typeof originalSelection.scale === "string" &&
      originalSelection.scale.length
    ) {
      randomizeConfig.setScale?.(originalSelection.scale);
    }
  }, [randomizeConfig]);

  const randomizeNowForPractice = useCallback(() => {
    markRandomizedDuringPractice();
    randomizeNow?.();
  }, [markRandomizedDuringPractice, randomizeNow]);

  const applyPickedScaleForPractice = useCallback(
    (result) => {
      markRandomizedDuringPractice();
      applyPickedScale?.(result);
    },
    [applyPickedScale, markRandomizedDuringPractice],
  );

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
          applyPickedScaleForPractice?.(pendingResult);
        } else {
          randomizeNowForPractice?.();
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
      applyPickedScaleForPractice,
      pickRandomizedScale,
      randomizeMode,
      randomizeNowForPractice,
      safeBarsPerScale,
    ],
  );

  useEffect(() => {
    pendingRandomizedScaleRef.current = null;
    barsRemainingRef.current = safeBarsPerScale;
    setBarsRemaining(safeBarsPerScale);
  }, [safeBarsPerScale, autoAdvanceEnabled]);

  const metronomeEngine = useMetronomePlayback({
    bpm,
    timeSig,
    subdivision,
    onBeat: handleMetronomeBeat,
  });

  useEffect(() => {
    if (metronomeEngine.isPlaying && !isPlayingRef.current) {
      practiceStartSelectionRef.current = null;
      randomizedDuringPracticeRef.current = false;
      capturePracticeStartSelection();
    }

    if (!metronomeEngine.isPlaying && isPlayingRef.current) {
      restorePracticeStartSelection();
      practiceStartSelectionRef.current = null;
      randomizedDuringPracticeRef.current = false;
      pendingRandomizedScaleRef.current = null;
    }

    isPlayingRef.current = metronomeEngine.isPlaying;
  }, [
    capturePracticeStartSelection,
    metronomeEngine.isPlaying,
    restorePracticeStartSelection,
  ]);

  const practiceActions = usePracticeActions({
    isPlaying: metronomeEngine.isPlaying,
    startMetronome: metronomeEngine.start,
    stopMetronome: metronomeEngine.stop,
    setBpm: metronomeSetters.setBpm,
    randomizeNow: randomizeNowForPractice,
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
      randomizeNow: randomizeNowForPractice,
      randomizeFromHotkey,
    }),
    [
      randomizeMode,
      setRandomizeMode,
      randomizeNowForPractice,
      randomizeFromHotkey,
    ],
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
