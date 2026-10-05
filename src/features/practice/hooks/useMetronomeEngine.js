import { useCallback, useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import i18n from "@shared/i18n";
import {
  useMetronomeEngineStore,
  selectMetronomeEngineActions,
  selectMetronomeEnginePlaybackState,
  selectMetronomeEngineCursorState,
} from "@features/practice/store/useMetronomeEngineStore";
import {
  clampBpm,
  parseBeatsPerBar,
  resolveStepPosition,
  scheduleClick,
  SUBDIVISION_STEPS,
} from "@features/practice/model/metronomeTiming";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
export function scheduleBeatUiUpdateWithAudioClock({
  ctx,
  when,
  beatNumber,
  barNumber,
  setCursor,
  onBeatRef,
  uiTimerIdsRef,
  setTimeoutFn = window.setTimeout,
}) {
  const delayMs = Math.max(0, (when - ctx.currentTime) * 1000);
  const id = setTimeoutFn(() => {
    setCursor({ currentBeat: beatNumber, currentBar: barNumber });
    onBeatRef.current?.({ beat: beatNumber, bar: barNumber, when });
  }, delayMs);
  uiTimerIdsRef.current.push(id);
  return { id, delayMs };
}

export function useMetronomePlaybackStatus() {
  return useMetronomeEngineStore(
    useShallow(selectMetronomeEnginePlaybackState),
  );
}

export function useMetronomeTickCursor() {
  return useMetronomeEngineStore(useShallow(selectMetronomeEngineCursorState));
}

export function useMetronomePlayback({
  bpm,
  timeSig,
  subdivision,
  countInEnabled = false,
  onBeat,
}) {
  const { isPlaying, audioReady, audioError } = useMetronomePlaybackStatus();
  const {
    setIsPlaying,
    setCursor,
    setAudioReady,
    setAudioError,
    resetCursorState,
    resetPlaybackState,
  } = useMetronomeEngineStore(useShallow(selectMetronomeEngineActions));

  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);
  const nextNoteTimeRef = useRef(0);
  const beatCursorRef = useRef(0);
  const barCursorRef = useRef(1);
  // Number of plain lead-in clicks still owed before real beat 1 — armed on
  // a fresh start when countInEnabled, consumed by scheduler() below. Kept
  // separate from beatCursorRef so count-in clicks never reach
  // scheduleBeatUiUpdate/onBeat and can't throw off bar counting for
  // auto-advance-scale or training-routine step tracking.
  const countInRemainingRef = useRef(0);
  const uiTimerIdsRef = useRef([]);
  const beatListenersRef = useRef(new Set());

  // Fans out every scheduled beat to every subscriber. Kept as a single,
  // never-reassigned function so scheduleBeatUiUpdateWithAudioClock's
  // onBeatRef contract (one callback) doesn't need to change — subscribers
  // are managed separately via the Set below.
  const notifyBeatListeners = useCallback((payload) => {
    for (const listener of beatListenersRef.current) {
      listener(payload);
    }
  }, []);
  const onBeatRef = useRef(notifyBeatListeners);

  // Lets any number of consumers (not just the `onBeat` prop) react to real
  // audio-scheduled beats — e.g. a feature that needs to know "N beats have
  // elapsed" without also owning its own independently-drifting clock.
  const subscribeBeat = useCallback((listener) => {
    if (typeof listener !== "function") return () => {};
    beatListenersRef.current.add(listener);
    return () => {
      beatListenersRef.current.delete(listener);
    };
  }, []);

  // `onBeat` is sugar for "subscribe one listener for the lifetime of this
  // prop's identity" — the original, still-supported way to hook a single
  // callback into the beat clock.
  useEffect(() => {
    if (typeof onBeat !== "function") return undefined;
    return subscribeBeat(onBeat);
  }, [onBeat, subscribeBeat]);

  const beatsPerBar = useMemo(() => parseBeatsPerBar(timeSig), [timeSig]);
  const safeBpm = useMemo(() => clampBpm(bpm), [bpm]);
  const stepsPerBeat = useMemo(
    () => SUBDIVISION_STEPS[subdivision] ?? 1,
    [subdivision],
  );

  const clearUiTimers = useCallback(() => {
    for (const id of uiTimerIdsRef.current) {
      clearTimeout(id);
    }
    uiTimerIdsRef.current = [];
  }, []);

  const ensureAudioContext = useCallback(async () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    }

    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) {
        throw new Error(i18n.t("practice.noWebAudio"));
      }
      const ctx = new Ctx();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      audioCtxRef.current = ctx;
      setAudioReady(true);
      setAudioError("");
      return ctx;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : i18n.t("practice.audioInitFailed");
      setAudioError(message);
      throw error;
    }
  }, [setAudioError, setAudioReady]);

  const stopScheduler = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetCursor = useCallback(() => {
    beatCursorRef.current = 0;
    barCursorRef.current = 1;
    nextNoteTimeRef.current = 0;
    countInRemainingRef.current = 0;
    resetCursorState();
  }, [resetCursorState]);

  const scheduleBeatUiUpdate = useCallback(
    (ctx, when, beatNumber, barNumber) => {
      scheduleBeatUiUpdateWithAudioClock({
        ctx,
        when,
        beatNumber,
        barNumber,
        setCursor,
        onBeatRef,
        uiTimerIdsRef,
      });
    },
    [setCursor],
  );

  // One count-in click: plain, unaccented, spaced a full beat apart, and
  // never reaches scheduleBeatUiUpdate/onBeat — see countInRemainingRef.
  const scheduleCountInStep = useCallback((ctx, secPerBeat) => {
    scheduleClick(ctx, nextNoteTimeRef.current, {
      accent: false,
      subdivision: false,
    });
    countInRemainingRef.current -= 1;
    nextNoteTimeRef.current += secPerBeat;
  }, []);

  // One real (beat-and-bar-tracked) click, main or subdivision.
  const scheduleBeatStep = useCallback(
    (ctx, secPerSubStep) => {
      const { stepInBeat, beatNumber, barNumber } = resolveStepPosition(
        beatCursorRef.current,
        stepsPerBeat,
        beatsPerBar,
      );

      const isDownBeat = stepInBeat === 0 && beatNumber === 1;
      const isMainBeat = stepInBeat === 0;
      const isSubClick = stepInBeat !== 0;

      scheduleClick(ctx, nextNoteTimeRef.current, {
        accent: isDownBeat,
        subdivision: isSubClick,
      });

      if (isMainBeat) {
        scheduleBeatUiUpdate(
          ctx,
          nextNoteTimeRef.current,
          beatNumber,
          barNumber || barCursorRef.current,
        );
        barCursorRef.current = barNumber;
      }

      beatCursorRef.current += 1;
      nextNoteTimeRef.current += secPerSubStep;
    },
    [beatsPerBar, scheduleBeatUiUpdate, stepsPerBeat],
  );

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const secPerBeat = 60 / safeBpm;
    const secPerSubStep = secPerBeat / stepsPerBeat;

    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
      if (countInRemainingRef.current > 0) {
        scheduleCountInStep(ctx, secPerBeat);
      } else {
        scheduleBeatStep(ctx, secPerSubStep);
      }
    }
  }, [safeBpm, stepsPerBeat, scheduleCountInStep, scheduleBeatStep]);

  const start = useCallback(async () => {
    if (isPlaying) return;
    await ensureAudioContext();
    setIsPlaying(true);
  }, [ensureAudioContext, isPlaying, setIsPlaying]);

  const stop = useCallback(() => {
    stopScheduler();
    clearUiTimers();
    resetCursor();
    resetPlaybackState();
  }, [clearUiTimers, resetCursor, resetPlaybackState, stopScheduler]);

  useEffect(
    () => () => {
      stopScheduler();
      clearUiTimers();
    },
    [clearUiTimers, stopScheduler],
  );

  // Tracks whether the *previous* run of this effect was already playing,
  // so a bpm/timeSig/subdivision tweak mid-play (which also re-runs this
  // effect, since scheduler's identity depends on them) can be told apart
  // from an actual start. Only an actual start should reset the beat/bar
  // cursor — otherwise every tempo nudge snaps the cursor back to beat
  // 1/bar 1 and fires a spurious real beat event for a boundary that never
  // happened.
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    if (!isPlaying) {
      wasPlayingRef.current = false;
      return;
    }

    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const justStarted = !wasPlayingRef.current;
    wasPlayingRef.current = true;

    stopScheduler();
    clearUiTimers();
    if (justStarted) {
      resetCursor();
      nextNoteTimeRef.current = ctx.currentTime + 0.03;
      if (countInEnabled) {
        countInRemainingRef.current = beatsPerBar;
      }
    }
    const intervalId = window.setInterval(scheduler, LOOKAHEAD_MS);
    timerRef.current = intervalId;
    scheduler();
    return () => {
      clearInterval(intervalId);
      if (timerRef.current === intervalId) timerRef.current = null;
    };
  }, [
    isPlaying,
    safeBpm,
    stepsPerBeat,
    beatsPerBar,
    countInEnabled,
    scheduler,
    clearUiTimers,
    resetCursor,
    stopScheduler,
  ]);

  return {
    start,
    stop,
    isPlaying,
    audioReady,
    audioError,
    subscribeBeat,
  };
}

export const useMetronomeEngine = useMetronomePlayback;
