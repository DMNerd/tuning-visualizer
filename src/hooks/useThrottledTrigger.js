import { useCallback, useEffect, useMemo, useRef } from "react";

export function createThrottledTrigger({
  callback,
  throttleMs,
  now = Date.now,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  const state = {
    timer: null,
    lastRunAt: null,
  };

  const invoke = () => {
    state.lastRunAt = now();
    callback?.();
  };

  const schedule = (waitMs) => {
    state.timer = setTimer(() => {
      state.timer = null;
      invoke();
    }, waitMs);
  };

  const runNow = () => {
    if (state.timer != null) {
      clearTimer(state.timer);
      state.timer = null;
    }
    invoke();
  };

  const trigger = () => {
    if (!Number.isFinite(throttleMs) || throttleMs <= 0) {
      invoke();
      return;
    }

    if (state.timer != null) return;

    if (state.lastRunAt == null) {
      invoke();
      return;
    }

    const elapsed = now() - state.lastRunAt;
    if (elapsed >= throttleMs) {
      invoke();
      return;
    }

    schedule(throttleMs - elapsed);
  };

  const dispose = () => {
    if (state.timer != null) {
      clearTimer(state.timer);
      state.timer = null;
    }
  };

  return { trigger, runNow, dispose };
}

export function useThrottledTrigger({ callback, throttleMs = 150 }) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const controller = useMemo(
    () =>
      createThrottledTrigger({
        callback: () => callbackRef.current?.(),
        throttleMs,
      }),
    [throttleMs],
  );

  useEffect(() => () => controller.dispose(), [controller]);

  const trigger = useCallback(() => {
    controller.trigger();
  }, [controller]);

  const runNow = useCallback(() => {
    controller.runNow();
  }, [controller]);

  return { trigger, runNow };
}

export default useThrottledTrigger;
