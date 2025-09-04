import { useMemo, useRef, useEffect } from "react";

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

  const prevDivRef = useRef(divisions);

  useEffect(() => {
    const prevN = prevDivRef.current;
    const nextN = divisions;

    if (prevN !== nextN) {
      if (!fretsTouched) {
        // Preserve drawn wires: nextSelected ≈ baseFrets * (prevN / nextN)
        const nextSelected = Math.max(
          12,
          Math.min(30, Math.round(baseFrets * (prevN / nextN))),
        );
        if (nextSelected !== baseFrets) {
          setFretsRaw(nextSelected); // use raw setter to avoid marking as "touched"
        }
      }
      prevDivRef.current = nextN;
    }
  }, [divisions, baseFrets, fretsTouched, setFretsRaw]);

  return drawFrets;
}
