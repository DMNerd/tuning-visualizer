import { useMemo, useCallback } from "react";

/**
 * Computes scale membership and degree lookup, and passes through chord info.
 * Inputs:
 *  - system: { divisions, ... }
 *  - rootIx: number (root pitch class)
 *  - intervals: number[] (relative scale pcs from root)
 *  - chordPCs: Set<number> | null
 *  - chordRootPc: number | null
 *
 * Returns:
 *  - scaleSet: Set<number> of absolute pcs in the current system
 *  - degreeForPc(pc): 1-based scale degree or null if not in the scale
 *  - chordPCs, chordRootPc (passed through for convenience)
 */
export function useScaleAndChord({
  system,
  rootIx,
  intervals,
  chordPCs,
  chordRootPc,
}) {
  const degreeMap = useMemo(() => {
    const map = new Map();
    intervals.forEach((interval, ix) => {
      map.set(interval, ix + 1);
    });
    return map;
  }, [intervals]);

  const scaleSet = useMemo(() => {
    const N = system.divisions;
    return new Set(intervals.map((v) => (v + rootIx) % N));
  }, [system, intervals, rootIx]);

  const degreeForPc = useCallback(
    (pc) => {
      const N = system.divisions;
      const rel = (pc - rootIx + N) % N;
      return degreeMap.get(rel) ?? null;
    },
    [system, rootIx, degreeMap],
  );

  return useMemo(
    () => ({ scaleSet, degreeForPc, chordPCs, chordRootPc }),
    [scaleSet, degreeForPc, chordPCs, chordRootPc],
  );
}
