// src/hooks/useInlays.js
import { useMemo } from "react";

/**
 * Computes center-inlay fret numbers for an N-TET board referenced to 12-TET.
 * Returns { inlaySingles, inlayDoubles } as arrays of fret indices (1..frets).
 */
export function useInlays({ frets, divisions }) {
  return useMemo(() => {
    const N = divisions;
    const maxSemi = Math.floor((frets * 12) / N);

    const singleBases = [3, 5, 7, 9, 15, 17, 19, 21];
    const singleSemis = [];
    for (let k = 0; k <= Math.ceil(maxSemi / 12); k++) {
      for (const b of singleBases) {
        const s = b + 12 * k;
        if (s <= maxSemi) singleSemis.push(s);
      }
    }

    const doubleSemis = [];
    for (let s = 12; s <= maxSemi; s += 12) doubleSemis.push(s);

    const semiToWire = (semi) => Math.round((semi * N) / 12);
    const uniq = (arr) => Array.from(new Set(arr));

    const inlaySingles = uniq(singleSemis.map(semiToWire)).filter(
      (f) => f >= 1 && f <= frets,
    );
    const inlayDoubles = uniq(doubleSemis.map(semiToWire)).filter(
      (f) => f >= 1 && f <= frets,
    );

    return { inlaySingles, inlayDoubles };
  }, [frets, divisions]);
}
