import type { TuningSystem } from "@/lib/theory/tuning";

/** Distance from nut for the k-th fret in N-TET (k >= 1).
 *  Classic formula generalizes by replacing 12 with N.
 */
export function fretDistanceFromNut(
  scaleLengthPx: number,
  k: number,
  sys: TuningSystem,
) {
  return scaleLengthPx - scaleLengthPx / Math.pow(2, k / sys.divisions);
}

/** Build an array of fret positions (x in px) for 1..fretCount. */
export function buildFrets(
  scaleLengthPx: number,
  fretCount: number,
  sys: TuningSystem,
) {
  return Array.from({ length: fretCount }, (_, i) =>
    fretDistanceFromNut(scaleLengthPx, i + 1, sys),
  );
}
