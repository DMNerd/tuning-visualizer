import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useShallow } from "zustand/react/shallow";

import { usePracticeActions } from "@features/practice/hooks/usePracticeActions";
import { useMetronomePlayback } from "@features/practice/hooks/useMetronomeEngine";
import {
  useRandomScale,
  formatRandomizedScaleAnnouncement,
} from "@features/theory";
import {
  useMetronomePrefsStore,
  selectMetronomeHydrateWithDefaults,
  selectMetronomePrefs,
  selectMetronomeRandomizeMode,
  selectMetronomeSetPrefs,
  selectMetronomeSetRandomizeMode,
  selectMetronomeSetters,
} from "@features/practice/store/useMetronomePrefsStore";
import { useMetronomeEngineStore } from "@features/practice/store/useMetronomeEngineStore";

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
  const setPracticeSecondsRemaining = useMetronomeEngineStore(
    (state) => state.setPracticeSecondsRemaining,
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
    timedPracticeEnabled,
    practiceDurationMinutes,
  } = metronomePrefs;

  const safeBarsPerScale = Math.max(1, Number(barsPerScale) || 1);
  const safePracticeDurationMinutes = Math.max(
    1,
    Number(practiceDurationMinutes) || 1,
  );
  const sessionDurationSeconds = safePracticeDurationMinutes * 60;
  const [barsRemaining, setBarsRemaining] = useState(safeBarsPerScale);
  const [secondsRemaining, setSecondsRemaining] = useState(
    sessionDurationSeconds,
  );
  const barsRemainingRef = useRef(safeBarsPerScale);
  const secondsRemainingRef = useRef(sessionDurationSeconds);
  const practiceSessionEndTimeRef = useRef(null);
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

  useEffect(() => {
    const nextSecondsRemaining = sessionDurationSeconds;
    secondsRemainingRef.current = nextSecondsRemaining;
    practiceSessionEndTimeRef.current = null;
    setSecondsRemaining(nextSecondsRemaining);
    setPracticeSecondsRemaining(
      timedPracticeEnabled ? nextSecondsRemaining : null,
    );
  }, [
    sessionDurationSeconds,
    setPracticeSecondsRemaining,
    timedPracticeEnabled,
  ]);

  const metronomeEngine = useMetronomePlayback({
    bpm,
    timeSig,
    subdivision,
    onBeat: handleMetronomeBeat,
  });
  const isMetronomePlaying = metronomeEngine.isPlaying;
  const stopMetronome = metronomeEngine.stop;

  useEffect(() => {
    if (!isMetronomePlaying || !timedPracticeEnabled) return;

    if (!practiceSessionEndTimeRef.current) {
      const startSeconds = Math.max(1, secondsRemainingRef.current);
      practiceSessionEndTimeRef.current = Date.now() + startSeconds * 1000;
    }

    const intervalId = window.setInterval(() => {
      const endTime = practiceSessionEndTimeRef.current;
      if (!endTime) return;

      const remainingSeconds = Math.max(
        0,
        Math.ceil((endTime - Date.now()) / 1000),
      );

      if (remainingSeconds !== secondsRemainingRef.current) {
        secondsRemainingRef.current = remainingSeconds;
        setSecondsRemaining(remainingSeconds);
        setPracticeSecondsRemaining(remainingSeconds);
      }

      if (remainingSeconds <= 0) {
        practiceSessionEndTimeRef.current = null;
        stopMetronome();
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [
    isMetronomePlaying,
    setPracticeSecondsRemaining,
    stopMetronome,
    timedPracticeEnabled,
  ]);

  useEffect(() => {
    if (isMetronomePlaying && !isPlayingRef.current) {
      practiceStartSelectionRef.current = null;
      randomizedDuringPracticeRef.current = false;
      capturePracticeStartSelection();
    }

    if (!isMetronomePlaying && isPlayingRef.current) {
      restorePracticeStartSelection();
      practiceStartSelectionRef.current = null;
      randomizedDuringPracticeRef.current = false;
      pendingRandomizedScaleRef.current = null;
      practiceSessionEndTimeRef.current = null;
      secondsRemainingRef.current = sessionDurationSeconds;
      setSecondsRemaining(sessionDurationSeconds);
      setPracticeSecondsRemaining(
        timedPracticeEnabled ? sessionDurationSeconds : null,
      );
    }

    isPlayingRef.current = isMetronomePlaying;
  }, [
    capturePracticeStartSelection,
    isMetronomePlaying,
    restorePracticeStartSelection,
    sessionDurationSeconds,
    setPracticeSecondsRemaining,
    timedPracticeEnabled,
  ]);

  const practiceActions = usePracticeActions({
    isPlaying: isMetronomePlaying,
    startMetronome: metronomeEngine.start,
    stopMetronome,
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
    const defaultDuration = Math.max(
      1,
      Number(metronomeDefaults.practiceDurationMinutes) || 1,
    );
    const nextSecondsRemaining = defaultDuration * 60;
    secondsRemainingRef.current = nextSecondsRemaining;
    setSecondsRemaining(nextSecondsRemaining);
    setPracticeSecondsRemaining(
      metronomeDefaults.timedPracticeEnabled ? nextSecondsRemaining : null,
    );
    practiceSessionEndTimeRef.current = null;
    practiceActions.resetTapTempo();
  }, [
    metronomeDefaults.barsPerScale,
    metronomeDefaults.practiceDurationMinutes,
    metronomeDefaults.timedPracticeEnabled,
    practiceActions,
    setPracticeSecondsRemaining,
  ]);

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
      safePracticeDurationMinutes,
      barsRemaining,
      secondsRemaining,
    }),
    [
      metronomePrefs,
      metronomeSetters,
      metronomeEngine,
      safeBarsPerScale,
      safePracticeDurationMinutes,
      barsRemaining,
      secondsRemaining,
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
