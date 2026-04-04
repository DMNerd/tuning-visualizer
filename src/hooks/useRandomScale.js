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

export function formatRandomizedScaleAnnouncement({ result, mode }) {
  if (!result) return "";

  if (mode === RANDOMIZE_MODES.KeyOnly) {
    return `root ${result.root}`;
  }

  if (mode === RANDOMIZE_MODES.ScaleOnly) {
    return `scale ${result.scale}`;
  }

  return `${result.root} ${result.scale}`;
}

export function useRandomScale({
  sysNames,
  scaleOptions,
  setRoot,
  setScale,
  mode = RANDOMIZE_MODES.Both,
  throttleMs = 150,
}) {
  const pickRandomizedScale = useCallback(() => {
    return pickRandomScale({ sysNames, scaleOptions });
  }, [sysNames, scaleOptions]);

  const applyPickedScale = useCallback(
    (result) => {
      applyRandomizedScale({ result, mode, setRoot, setScale });
    },
    [mode, setRoot, setScale],
  );

  const randomizeNow = useCallback(() => {
    const result = pickRandomizedScale();
    applyPickedScale(result);
  }, [pickRandomizedScale, applyPickedScale]);

  const { trigger, runNow } = useThrottledTrigger({
    callback: randomizeNow,
    throttleMs,
  });

  const randomizeFromHotkey = useCallback(() => {
    trigger();
  }, [trigger]);

  return {
    randomizeNow,
    randomizeFromHotkey,
    runNow,
    pickRandomizedScale,
    applyPickedScale,
  };
}

export default useRandomScale;
