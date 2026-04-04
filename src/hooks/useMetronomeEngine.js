import { useCallback, useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useMetronomeEngineStore,
  selectMetronomeEngineActions,
  selectMetronomeEngineState,
} from "@/stores/useMetronomeEngineStore";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const CLICK_DURATION_SEC = 0.03;

const SUBDIVISION_STEPS = {
  Quarter: 1,
  Eighth: 2,
  Triplet: 3,
  Sixteenth: 4,
};

function parseBeatsPerBar(timeSig) {
  const beats = Number.parseInt(String(timeSig).split("/")[0], 10);
  return Number.isFinite(beats) && beats > 0 ? beats : 4;
}

function clampBpm(value) {
  const bpm = Number(value);
  if (!Number.isFinite(bpm)) return 80;
  return Math.max(20, Math.min(300, Math.round(bpm)));
}

function scheduleClick(
  ctx,
  when,
  { accent = false, subdivision = false } = {},
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const baseFreq = accent ? 1480 : subdivision ? 900 : 1180;
  const peak = accent ? 0.26 : subdivision ? 0.08 : 0.14;

  osc.type = "square";
  osc.frequency.setValueAtTime(baseFreq, when);

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + CLICK_DURATION_SEC);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + CLICK_DURATION_SEC + 0.01);
}

export function useMetronomeEngine({ bpm, timeSig, subdivision, onBeat }) {
  const { isPlaying, currentBeat, currentBar, audioReady, audioError } =
    useMetronomeEngineStore(useShallow(selectMetronomeEngineState));
  const {
    setIsPlaying,
    setCurrentBeat,
    setCurrentBar,
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
  const uiTimerIdsRef = useRef([]);
  const onBeatRef = useRef(onBeat);

  useEffect(() => {
    onBeatRef.current = onBeat;
  }, [onBeat]);

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
        throw new Error("Web Audio API is not available in this browser.");
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
        error instanceof Error ? error.message : "Failed to initialize audio.";
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
    resetCursorState();
  }, [resetCursorState]);

  const scheduleBeatUiUpdate = useCallback(
    (when, beatNumber, barNumber) => {
      const now = performance.now();
      const delayMs = Math.max(0, when * 1000 - now);
      const id = window.setTimeout(() => {
        setCurrentBeat(beatNumber);
        setCurrentBar(barNumber);
        onBeatRef.current?.({ beat: beatNumber, bar: barNumber, when });
      }, delayMs);
      uiTimerIdsRef.current.push(id);
    },
    [setCurrentBeat, setCurrentBar],
  );

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const secPerBeat = 60 / safeBpm;
    const secPerSubStep = secPerBeat / stepsPerBeat;

    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
      const stepInBeat = beatCursorRef.current % stepsPerBeat;
      const beatIndex = Math.floor(beatCursorRef.current / stepsPerBeat);
      const beatNumber = (beatIndex % beatsPerBar) + 1;
      const barNumber = Math.floor(beatIndex / beatsPerBar) + 1;

      const isDownBeat = stepInBeat === 0 && beatNumber === 1;
      const isMainBeat = stepInBeat === 0;
      const isSubClick = stepInBeat !== 0;

      scheduleClick(ctx, nextNoteTimeRef.current, {
        accent: isDownBeat,
        subdivision: isSubClick,
      });

      if (isMainBeat) {
        scheduleBeatUiUpdate(
          nextNoteTimeRef.current,
          beatNumber,
          barNumber || barCursorRef.current,
        );
        barCursorRef.current = barNumber;
      }

      beatCursorRef.current += 1;
      nextNoteTimeRef.current += secPerSubStep;
    }
  }, [beatsPerBar, safeBpm, scheduleBeatUiUpdate, stepsPerBeat]);

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

  useEffect(() => {
    if (!isPlaying) return;

    const ctx = audioCtxRef.current;
    if (!ctx) return;

    stopScheduler();
    clearUiTimers();
    resetCursor();
    nextNoteTimeRef.current = ctx.currentTime + 0.03;
    timerRef.current = window.setInterval(scheduler, LOOKAHEAD_MS);
    scheduler();
  }, [
    isPlaying,
    safeBpm,
    stepsPerBeat,
    beatsPerBar,
    scheduler,
    clearUiTimers,
    resetCursor,
    stopScheduler,
  ]);

  return {
    start,
    stop,
    isPlaying,
    currentBeat,
    currentBar,
    audioReady,
    audioError,
  };
}
