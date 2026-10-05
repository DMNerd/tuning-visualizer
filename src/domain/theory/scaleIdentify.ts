import { mod } from "@shared/lib/math";
import type { ScaleDef } from "@domain/theory/scales";
import { detectScales } from "@domain/theory/tonalAdapter";

export interface ScaleMatch {
  rootPc: number;
  /** Label of the scale in the scale picker. */
  label: string;
  /** The scale has exactly the picked notes (no others). */
  exact: boolean;
  /** Notes of the scale that weren't picked. */
  extraNotes: number;
}

/**
 * Scales that contain every picked pitch class, rooted on one of the picks:
 * exact matches first, then scales rooted on the first pick, seven-note
 * scales, and those with the fewest notes that weren't picked. Only scales
 * the picker offers are listed.
 */
export function identifyScales(
  pickedPcs: Iterable<number>,
  divisions: number,
  scaleOptions: readonly ScaleDef[],
  limit = 6,
): ScaleMatch[] {
  if (!Number.isInteger(divisions) || divisions < 1) return [];
  const picked = [...new Set([...pickedPcs].map((pc) => mod(pc, divisions)))];
  if (picked.length < 3) return [];

  const labelOf = new Map(
    scaleOptions.flatMap((option) =>
      option.name ? [[option.name, option] as const] : [],
    ),
  );
  const matches: ScaleMatch[] = [];
  for (const rootPc of picked) {
    for (const { name, exact } of detectScales(picked, divisions, rootPc)) {
      const option = labelOf.get(name);
      if (!option) continue;
      matches.push({
        rootPc,
        label: option.label,
        exact,
        extraNotes: option.pcs.length - picked.length,
      });
    }
  }
  const rank = (match: ScaleMatch) => [
    match.exact ? 0 : 1,
    match.rootPc === picked[0] ? 0 : 1,
    // seven-note scales are the usual parent scales
    match.extraNotes + picked.length === 7 ? 0 : 1,
    match.extraNotes,
  ];
  return matches
    .sort((a, b) => {
      const [ra, rb] = [rank(a), rank(b)];
      const i = ra.findIndex((value, k) => value !== rb[k]);
      return i < 0 ? 0 : ra[i] - rb[i];
    })
    .slice(0, limit);
}
