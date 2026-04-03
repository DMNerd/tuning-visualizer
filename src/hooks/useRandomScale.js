import { useCallback } from "react";
import { pickRandomScale } from "@/utils/random";
import { useThrottledTrigger } from "@/hooks/useThrottledTrigger";

export const RANDOMIZE_MODES = {
  Both: "both",
  ScaleOnly: "scale",
  KeyOnly: "key",
};

export function applyRandomizedScale({ result, mode, setRoot, setScale }) {
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
}

export function useRandomScale({
  sysNames,
  scaleOptions,
  setRoot,
  setScale,
  mode = RANDOMIZE_MODES.Both,
  throttleMs = 150,
}) {
  const randomizeNow = useCallback(() => {
    const result = pickRandomScale({ sysNames, scaleOptions });
    applyRandomizedScale({ result, mode, setRoot, setScale });
  }, [sysNames, scaleOptions, mode, setRoot, setScale]);

  const { trigger, runNow } = useThrottledTrigger({
    callback: randomizeNow,
    throttleMs,
  });

  const randomizeFromHotkey = useCallback(() => {
    trigger();
  }, [trigger]);

  return { randomizeNow, randomizeFromHotkey, runNow };
}

export default useRandomScale;
