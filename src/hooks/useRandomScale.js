import { useCallback, useEffect, useRef, useState } from "react";
import { useThrottleFn } from "react-use";
import { pickRandomScale } from "@/utils/random";

export function useRandomScale({
  sysNames,
  scaleOptions,
  setRoot,
  setScale,
  throttleMs = 150,
}) {
  const randomize = useCallback(() => {
    const result = pickRandomScale({ sysNames, scaleOptions });
    if (!result) return;
    const { root: nextRoot, scale: nextScale } = result;
    setRoot(nextRoot);
    setScale(nextScale);
  }, [sysNames, scaleOptions, setRoot, setScale]);

  const randomizeRef = useRef(randomize);
  useEffect(() => {
    randomizeRef.current = randomize;
  }, [randomize]);

  const [hotkeyTick, setHotkeyTick] = useState(-1);

  useThrottleFn(
    (tick) => {
      if (tick < 0) return;
      randomizeRef.current();
    },
    throttleMs,
    [hotkeyTick],
  );

  const triggerFromHotkey = useCallback(() => {
    setHotkeyTick((count) => count + 1);
  }, []);

  return { randomize, triggerFromHotkey };
}

export default useRandomScale;
