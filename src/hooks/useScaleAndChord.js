import { useMemo } from "react";

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
  const scaleSet = useMemo(
    () => new Set(intervals.map((v) => (v + rootIx) % system.divisions)),
    [intervals, rootIx, system.divisions],
  );

  const degreeForPc = (pc) => {
    const rel = (pc - rootIx + system.divisions) % system.divisions;
    const ix = intervals.indexOf(rel);
    return ix >= 0 ? ix + 1 : null;
  };

  return { scaleSet, degreeForPc, chordPCs, chordRootPc };
}
