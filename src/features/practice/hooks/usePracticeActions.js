import { useCallback, useMemo, useRef } from "react";
import {
  METRONOME_BPM_MAX,
  METRONOME_BPM_MIN,
} from "@features/practice/model/metronomeTiming";

// Non-numeric/zero input falls back to 80 before clamping (unlike the engine's
// clampBpm, which also maps non-finite values to 80 but clamps 0 up to 20).
function clampBpm(value) {
  return Math.max(
    METRONOME_BPM_MIN,
    Math.min(METRONOME_BPM_MAX, Math.round(Number(value) || 80)),
  );
}

export function usePracticeActions({
  isPlaying,
  startMetronome,
  stopMetronome,
  setBpm,
  randomizeNow,
  randomizeFromHotkey,
}) {
  const tapTempoTimesRef = useRef([]);

  const toggleMetronome = useCallback(() => {
    if (isPlaying) stopMetronome?.();
    else startMetronome?.();
  }, [isPlaying, startMetronome, stopMetronome]);

  const bpmUp = useCallback(() => {
    setBpm?.((prev) => clampBpm((Number(prev) || 80) + 1));
  }, [setBpm]);

  const bpmDown = useCallback(() => {
    setBpm?.((prev) => clampBpm((Number(prev) || 80) - 1));
  }, [setBpm]);

  const tapTempo = useCallback(() => {
    const now = Date.now();
    const nextTimes = [...tapTempoTimesRef.current, now].slice(-5);
    tapTempoTimesRef.current = nextTimes;
    if (nextTimes.length < 2) return;

    const intervals = [];
    for (let i = 1; i < nextTimes.length; i += 1) {
      const interval = nextTimes[i] - nextTimes[i - 1];
      if (interval > 0) intervals.push(interval);
    }
    if (!intervals.length) return;

    const averageMs =
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    setBpm?.(clampBpm(60000 / averageMs));
  }, [setBpm]);

  const randomizeScaleNow = useCallback(() => {
    randomizeNow?.();
  }, [randomizeNow]);

  const randomizeScaleFromHotkey = useCallback(() => {
    randomizeFromHotkey?.();
  }, [randomizeFromHotkey]);

  const resetTapTempo = useCallback(() => {
    tapTempoTimesRef.current = [];
  }, []);

  return useMemo(
    () => ({
      toggleMetronome,
      bpmUp,
      bpmDown,
      tapTempo,
      randomizeScaleNow,
      randomizeScaleFromHotkey,
      resetTapTempo,
    }),
    [
      toggleMetronome,
      bpmUp,
      bpmDown,
      tapTempo,
      randomizeScaleNow,
      randomizeScaleFromHotkey,
      resetTapTempo,
    ],
  );
}
