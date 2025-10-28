import { useMemo, useEffect } from "react";
import { usePrevious } from "react-use";
import { FRETS_MIN, FRETS_MAX } from "@/lib/config/appDefaults";
import { clamp } from "@/utils/math";

/**
 * Normalize drawn fret count across temperaments.
 * - Returns a derived `drawFrets` to render (≈ frets * divisions / 12).
 * - When `divisions` changes, updates the *selected* `frets` (via setFretsRaw)
 *   to preserve visual density — unless the user has touched the control.
 */
export function useDrawFrets({
  baseFrets,
  divisions,
  fretsTouched,
  setFretsRaw,
}) {
  const drawFrets = useMemo(() => {
    const factor = (divisions || 12) / 12;
    return Math.max(1, Math.round(baseFrets * factor));
  }, [baseFrets, divisions]);

  const prevDivisions = usePrevious(divisions);

  useEffect(() => {
    if (prevDivisions === undefined || prevDivisions === divisions) {
      return;
    }

    if (!fretsTouched) {
      const nextSelected = clamp(
        Math.round(baseFrets * (prevDivisions / divisions)),
        FRETS_MIN,
        FRETS_MAX,
      );
      if (nextSelected !== baseFrets) {
        setFretsRaw(nextSelected);
      }
    }
  }, [divisions, prevDivisions, baseFrets, fretsTouched, setFretsRaw]);

  return drawFrets;
}
