import { useCallback, useEffect, useRef } from "react";
import { useLatest } from "react-use";
import { toast } from "react-hot-toast";

import { PRESET_TUNINGS } from "@domain/presets/presetState";
import { applyResolvedTuning } from "@shared/lib/applyResolvedTuning";
import { useMetronomePrefsStore } from "@features/practice/store/useMetronomePrefsStore";
import { advancePlaybackBeat } from "@features/training/model/routinePlaybackEngine";
import { nameForRootPc } from "@features/training/model/routine";
import { useRoutinePlaybackStore } from "@features/training/store/useRoutinePlaybackStore";

/**
 * Orchestrates routine playback by taking over the shared Metronome engine
 * (bpm/timeSig/start/stop) and the theory store (system/root/scale), and
 * applying the Start block's tuning preset once via `applyResolvedTuning`
 * (the same system->strings->tuning sequencing @features/share's URL
 * hydration uses, to avoid the instrument's own preset-reapply race on
 * system change).
 *
 * Block-advancement subscribes to the shared engine's real audio-scheduled
 * beats (`subscribeBeat`) rather than running an independent clock — this
 * keeps "a block has elapsed" locked to the actual clicks the user hears,
 * with no drift over a long run. Because the subscription is a plain
 * listener registered once per playback session, changing bpm/timeSig at a
 * step boundary (which makes the engine reset its own scheduler) doesn't
 * require re-subscribing — the listener just keeps receiving whatever beats
 * the engine schedules next, at the new tempo.
 */
export function useRoutinePlayback({
  theoryDomain,
  instrumentDomain,
  startMetronome,
  stopMetronome,
  subscribeBeat,
}) {
  const theoryDomainRef = useLatest(theoryDomain);
  const instrumentDomainRef = useLatest(instrumentDomain);
  const startMetronomeRef = useLatest(startMetronome);
  const stopMetronomeRef = useLatest(stopMetronome);
  const subscribeBeatRef = useLatest(subscribeBeat);

  const unsubscribeBeatRef = useRef(null);
  const savedAutoAdvanceRef = useRef(false);

  const unsubscribeFromBeats = useCallback(() => {
    unsubscribeBeatRef.current?.();
    unsubscribeBeatRef.current = null;
  }, []);

  const applyStep = useCallback(
    (systemId, step) => {
      const theory = theoryDomainRef.current;
      // Prefer the live, display-preference-aware namer (same one every
      // other note label in the app uses) — play() has already forced the
      // theory system to match `systemId` via applyResolvedTuning, so this
      // is safe. Only fall back to the plain namer if that's unavailable.
      const rootName =
        theory?.system?.nameForPc?.(step.rootPc) ??
        nameForRootPc(systemId, step.rootPc);
      theory?.system?.setRoot?.(rootName);
      theory?.scale?.setScale?.(step.scaleLabel);
      const { setBpm, setTimeSig } = useMetronomePrefsStore.getState().setters;
      setBpm?.(step.bpm);
      setTimeSig?.(step.timeSig);
    },
    [theoryDomainRef],
  );

  const stop = useCallback(() => {
    unsubscribeFromBeats();
    stopMetronomeRef.current?.();
    useMetronomePrefsStore
      .getState()
      .setters.setAutoAdvanceEnabled?.(savedAutoAdvanceRef.current);
    useRoutinePlaybackStore.getState().clear();
  }, [unsubscribeFromBeats, stopMetronomeRef]);

  const handleBeat = useCallback(() => {
    const { activeRoutine, stepIndex, elapsedBeats } =
      useRoutinePlaybackStore.getState();
    if (!activeRoutine) return;

    const result = advancePlaybackBeat({
      steps: activeRoutine.steps,
      stepIndex,
      elapsedBeats,
    });

    if (result.done) {
      stop();
      return;
    }

    useRoutinePlaybackStore
      .getState()
      .setProgress(result.stepIndex, result.elapsedBeats);

    if (result.stepChanged) {
      const nextStep = activeRoutine.steps[result.stepIndex];
      applyStep(activeRoutine.startBlock.systemId, nextStep);
    }
  }, [applyStep, stop]);

  const play = useCallback(
    (routine) => {
      if (!routine?.steps?.length) {
        toast.error("This routine has no scale blocks yet.", {
          id: "training-routine-play",
        });
        return;
      }

      try {
        const { startBlock, steps } = routine;
        const theory = theoryDomainRef.current;
        const instrument = instrumentDomainRef.current;

        const tuningArray =
          PRESET_TUNINGS?.[startBlock.systemId]?.[startBlock.strings]?.[
            startBlock.presetName
          ];
        applyResolvedTuning({
          setSystemId: theory?.system?.setSystemId,
          setStrings: instrument?.instrumentActions?.setStrings,
          setTuning: instrument?.instrumentActions?.setTuning,
          setTuningAtomic: instrument?.instrumentActions?.setTuningAtomic,
          systemId: startBlock.systemId,
          strings: startBlock.strings,
          tuning: tuningArray,
        });
        instrument?.presets?.setPreset?.(startBlock.presetName);

        savedAutoAdvanceRef.current =
          useMetronomePrefsStore.getState().prefs.autoAdvanceEnabled;
        useMetronomePrefsStore
          .getState()
          .setters.setAutoAdvanceEnabled?.(false);

        useRoutinePlaybackStore.getState().beginRoutine(routine, stop);
        applyStep(startBlock.systemId, steps[0]);

        unsubscribeFromBeats();
        unsubscribeBeatRef.current =
          subscribeBeatRef.current?.(handleBeat) ?? null;

        // start() is async (it awaits AudioContext setup) and its rejection
        // wouldn't otherwise surface here — if it fails, tear playback back
        // down instead of leaving autoAdvanceEnabled disabled indefinitely.
        const startResult = startMetronomeRef.current?.();
        if (typeof startResult?.catch === "function") {
          startResult.catch(() => stop());
        }
      } catch {
        stop();
      }
    },
    [
      applyStep,
      handleBeat,
      instrumentDomainRef,
      startMetronomeRef,
      stop,
      subscribeBeatRef,
      theoryDomainRef,
      unsubscribeFromBeats,
    ],
  );

  const pause = useCallback(() => {
    stopMetronomeRef.current?.();
    useRoutinePlaybackStore.getState().setPaused(true);
  }, [stopMetronomeRef]);

  const resume = useCallback(() => {
    const { activeRoutine } = useRoutinePlaybackStore.getState();
    if (!activeRoutine) return;
    useRoutinePlaybackStore.getState().setPaused(false);
    startMetronomeRef.current?.();
  }, [startMetronomeRef]);

  // Safety net: don't leak a beat subscription if this hook instance ever
  // unmounts mid-playback (App.jsx keeps it mounted for the app's lifetime
  // in normal operation, but this guards hot-reload/remount edge cases).
  useEffect(() => unsubscribeFromBeats, [unsubscribeFromBeats]);

  return { play, pause, resume, stop };
}
