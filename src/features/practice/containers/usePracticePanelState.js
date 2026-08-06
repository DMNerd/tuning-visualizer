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
  useRoutinePlaybackStore,
  selectIsRoutinePlaying,
} from "@features/training";
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
  // A training routine drives this same shared metronome engine (see
  // @features/training's useRoutinePlayback). Practice needs to know when
  // that's the case so it doesn't run its own timed-session/start-selection
  // bookkeeping over a session it doesn't own, and so its Stop control tears
  // the routine down properly instead of just killing the engine under it.
  const isRoutinePlaying = useRoutinePlaybackStore(selectIsRoutinePlaying);
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
    countInEnabled,
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
  const isRoutineSessionRef = useRef(false);

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
    countInEnabled,
    onBeat: handleMetronomeBeat,
  });
  const isMetronomePlaying = metronomeEngine.isPlaying;
  const stopMetronome = metronomeEngine.stop;

  // Stopping the engine directly while a routine owns it would leave the
  // routine store stuck "playing" and autoAdvanceEnabled permanently
  // disabled (see useRoutinePlayback.stop's cleanup). Route through the
  // routine's own teardown when one is active instead.
  const stopMetronomeOrRoutine = useCallback(() => {
    const { activeRoutine, requestStop } = useRoutinePlaybackStore.getState();
    if (activeRoutine && requestStop) {
      requestStop();
      return;
    }
    stopMetronome();
  }, [stopMetronome]);

  // Owns the whole timed-practice countdown lifecycle in one place: reset
  // the displayed remaining time whenever the configured duration changes,
  // then (only while actually running one) own the interval that counts an
  // active session down. Merged into a single effect specifically so
  // "duration changed, forget the old end time" and "the running interval
  // needs to notice and recompute it" can't drift apart — previously two
  // separate effects shared practiceSessionEndTimeRef across an implicit
  // ordering dependency (one nulled it, the other had to be re-triggered by
  // an unrelated-looking dependency to notice), which is exactly the kind
  // of thing that silently breaks if either effect's deps ever change.
  useEffect(() => {
    const nextSecondsRemaining = sessionDurationSeconds;
    secondsRemainingRef.current = nextSecondsRemaining;
    practiceSessionEndTimeRef.current = null;
    setSecondsRemaining(nextSecondsRemaining);
    setPracticeSecondsRemaining(
      timedPracticeEnabled ? nextSecondsRemaining : null,
    );

    // A training routine defines its own length via its steps — Practice's
    // independent session timer must not cut a routine off early.
    if (!isMetronomePlaying || !timedPracticeEnabled || isRoutinePlaying) {
      return undefined;
    }

    const startSeconds = Math.max(1, nextSecondsRemaining);
    practiceSessionEndTimeRef.current = Date.now() + startSeconds * 1000;

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
    sessionDurationSeconds,
    isMetronomePlaying,
    isRoutinePlaying,
    setPracticeSecondsRemaining,
    stopMetronome,
    timedPracticeEnabled,
  ]);

  useEffect(() => {
    if (isMetronomePlaying && !isPlayingRef.current) {
      // Decided once, at the moment this play session starts: a routine's
      // own stop() clears activeRoutine before this effect can observe the
      // matching false-transition below, so isRoutinePlaying can't be
      // trusted there — this ref carries the answer across the session.
      isRoutineSessionRef.current = isRoutinePlaying;
      if (!isRoutineSessionRef.current) {
        practiceStartSelectionRef.current = null;
        randomizedDuringPracticeRef.current = false;
        capturePracticeStartSelection();
      }
    }

    if (!isMetronomePlaying && isPlayingRef.current) {
      // Restoring here would clobber a routine's final step root/scale with
      // whatever was live before it started — that bookkeeping belongs to
      // the routine, not Practice.
      if (!isRoutineSessionRef.current) {
        restorePracticeStartSelection();
      }
      practiceStartSelectionRef.current = null;
      randomizedDuringPracticeRef.current = false;
      pendingRandomizedScaleRef.current = null;
      practiceSessionEndTimeRef.current = null;
      secondsRemainingRef.current = sessionDurationSeconds;
      setSecondsRemaining(sessionDurationSeconds);
      setPracticeSecondsRemaining(
        timedPracticeEnabled ? sessionDurationSeconds : null,
      );
      isRoutineSessionRef.current = false;
    }

    isPlayingRef.current = isMetronomePlaying;
  }, [
    capturePracticeStartSelection,
    isMetronomePlaying,
    isRoutinePlaying,
    restorePracticeStartSelection,
    sessionDurationSeconds,
    setPracticeSecondsRemaining,
    timedPracticeEnabled,
  ]);

  const practiceActions = usePracticeActions({
    isPlaying: isMetronomePlaying,
    startMetronome: metronomeEngine.start,
    stopMetronome: stopMetronomeOrRoutine,
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
      isRoutinePlaying,
      stopMetronomeOrRoutine,
    }),
    [
      metronomePrefs,
      metronomeSetters,
      metronomeEngine,
      safeBarsPerScale,
      safePracticeDurationMinutes,
      barsRemaining,
      secondsRemaining,
      isRoutinePlaying,
      stopMetronomeOrRoutine,
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
