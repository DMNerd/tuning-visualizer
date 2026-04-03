import { useCallback, useEffect, useRef, useState } from "react";
import { useThrottleFn } from "react-use";
import { pickRandomScale } from "@/utils/random";

export const RANDOMIZE_MODES = {
  Both: "both",
  ScaleOnly: "scale",
  KeyOnly: "key",
};

export function useRandomScale({
  sysNames,
  scaleOptions,
  setRoot,
  setScale,
  mode = RANDOMIZE_MODES.Both,
  throttleMs = 150,
}) {
  const randomize = useCallback(() => {
    const result = pickRandomScale({ sysNames, scaleOptions });
    if (!result) return;
    const { root: nextRoot, scale: nextScale } = result;
    if (mode === RANDOMIZE_MODES.KeyOnly) {
      setRoot(nextRoot);
      return;
    }
    if (mode === RANDOMIZE_MODES.ScaleOnly) {
      setScale(nextScale);
      return;
    }
    setRoot(nextRoot);
    setScale(nextScale);
  }, [sysNames, scaleOptions, setRoot, setScale, mode]);

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
