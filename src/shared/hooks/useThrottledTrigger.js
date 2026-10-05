import { useCallback, useEffect, useRef } from "react";
import { useLatest } from "@shared/hooks/stateHooks";

// Leading + trailing throttle: the first trigger runs immediately, later
// triggers inside the window collapse into one run when it ends.
export function useThrottledTrigger({ callback, throttleMs = 150 }) {
  const callbackRef = useLatest(callback);
  const timeoutRef = useRef(undefined);
  const pendingRef = useRef(false);
  const isThrottled = Number.isFinite(throttleMs) && throttleMs > 0;

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const startWindow = useCallback(() => {
    const tick = () => {
      if (pendingRef.current) {
        pendingRef.current = false;
        callbackRef.current?.();
        timeoutRef.current = setTimeout(tick, throttleMs);
      } else {
        timeoutRef.current = undefined;
      }
    };
    timeoutRef.current = setTimeout(tick, throttleMs);
  }, [callbackRef, throttleMs]);

  const trigger = useCallback(() => {
    if (isThrottled && timeoutRef.current !== undefined) {
      pendingRef.current = true;
      return;
    }
    callbackRef.current?.();
    if (isThrottled) startWindow();
  }, [callbackRef, isThrottled, startWindow]);

  // Runs now and absorbs any pending trailing run.
  const runNow = useCallback(() => {
    pendingRef.current = false;
    callbackRef.current?.();
    if (isThrottled && timeoutRef.current === undefined) startWindow();
  }, [callbackRef, isThrottled, startWindow]);

  return { trigger, runNow };
}

export default useThrottledTrigger;
