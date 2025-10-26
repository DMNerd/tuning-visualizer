import { useMemo, useEffect } from "react";
import { usePrevious } from "react-use";

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
      // Preserve drawn wires: nextSelected ≈ baseFrets * (prevDivisions / divisions)
      const nextSelected = Math.max(
        12,
        Math.min(30, Math.round(baseFrets * (prevDivisions / divisions))),
      );
      if (nextSelected !== baseFrets) {
        setFretsRaw(nextSelected); // use raw setter to avoid marking as "touched"
      }
    }
  }, [divisions, prevDivisions, baseFrets, fretsTouched, setFretsRaw]);

  return drawFrets;
}
