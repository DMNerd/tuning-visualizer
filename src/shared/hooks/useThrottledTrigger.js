import { useCallback, useEffect, useRef, useState } from "react";
import useThrottleFn from "react-use/esm/useThrottleFn.js";

export function useThrottledTrigger({ callback, throttleMs = 150 }) {
  const callbackRef = useRef(callback);
  const skipNextThrottledCallRef = useRef(false);
  const [triggerVersion, setTriggerVersion] = useState(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useThrottleFn(
    () => {
      if (triggerVersion === 0) return;
      if (skipNextThrottledCallRef.current) {
        skipNextThrottledCallRef.current = false;
        return;
      }
      callbackRef.current?.();
    },
    throttleMs,
    [triggerVersion],
  );

  const trigger = useCallback(() => {
    if (!Number.isFinite(throttleMs) || throttleMs <= 0) {
      callbackRef.current?.();
      return;
    }
    setTriggerVersion((version) => version + 1);
  }, [throttleMs]);

  const runNow = useCallback(() => {
    if (!Number.isFinite(throttleMs) || throttleMs <= 0) {
      callbackRef.current?.();
      return;
    }
    skipNextThrottledCallRef.current = true;
    callbackRef.current?.();
    setTriggerVersion((version) => version + 1);
  }, [throttleMs]);

  return { trigger, runNow };
}

export default useThrottledTrigger;
