import { mod } from "@shared/lib/math";
import { stepsFrequency } from "@domain/theory/tonalAdapter";

/**
 * Frequencies of pitch classes played upwards, the first one in `octave`
 * (A4 = refFreq): each note is the next one above the previous.
 */
export function ascendingFrequencies(
  pcs: readonly number[],
  divisions: number,
  refFreq = 440,
  octave = 4,
): number[] {
  let previous = -Infinity;
  return pcs.flatMap((pc) => {
    let steps = octave * divisions + mod(pc, divisions);
    while (steps <= previous) steps += divisions;
    previous = steps;
    const freq = stepsFrequency(steps, divisions, refFreq);
    return freq === null ? [] : [freq];
  });
}

/** A chord voiced upwards from its root, in the octave below middle C. */
export function chordFrequencies(
  rootPc: number,
  pcs: Iterable<number>,
  divisions: number,
  refFreq = 440,
): number[] {
  const fromRoot = (pc: number) => mod(pc - rootPc, divisions);
  const voiced = [...pcs].sort((a, b) => fromRoot(a) - fromRoot(b));
  return ascendingFrequencies(voiced, divisions, refFreq, 3);
}
