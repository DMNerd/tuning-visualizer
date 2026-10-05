// Chords and modes of a scale, from the theory engine's chord types and
// scale dictionary (see tonalAdapter.ts).

import { mod } from "@shared/lib/math";
import type { ScaleDef } from "@domain/theory/scales";
import {
  chordTypesForEdo,
  intervalSteps,
  scaleModes,
} from "@domain/theory/tonalAdapter";

export interface DegreeChords {
  degree: number;
  rootPc: number;
  /** Chord types on this degree whose notes are all in the scale. */
  types: string[];
}

/**
 * The common chords (triads and sevenths of the core chord types) built on
 * each degree of a scale, using only notes of the scale.
 */
export function chordsInScale(
  rootPc: number,
  scaleIntervals: readonly number[],
  divisions: number,
  perDegree = 3,
): DegreeChords[] {
  const scale = new Set(scaleIntervals.map((step) => mod(step, divisions)));
  const candidates = chordTypesForEdo(divisions)
    .filter(({ tier, intervals }) => tier === 0 && intervals.length <= 4)
    .map(({ type, intervals }) => ({
      type,
      steps: intervals.map((ivl) => intervalSteps(ivl, divisions)),
      // chords with a third before suspended ones
      suspended: !intervals.some((ivl) => /^[↑↓]*3/.test(ivl)),
    }))
    .sort(
      (a, b) =>
        Number(a.suspended) - Number(b.suspended) ||
        a.steps.length - b.steps.length,
    );

  return [...scale]
    .sort((a, b) => a - b)
    .map((degreeStep, index) => ({
      degree: index + 1,
      rootPc: mod(rootPc + degreeStep, divisions),
      types: candidates
        .filter(({ steps }) =>
          steps.every((step) => scale.has(mod(degreeStep + step, divisions))),
        )
        .slice(0, perDegree)
        .map(({ type }) => type),
    }));
}

export interface ScaleMode {
  rootPc: number;
  label: string;
}

/** The other named scales with the same notes, starting on another degree. */
export function modesOfScale(
  scale: ScaleDef | undefined,
  rootPc: number,
  divisions: number,
  scaleOptions: readonly ScaleDef[],
): ScaleMode[] {
  if (!scale?.name) return [];
  const labelOf = new Map(
    scaleOptions.flatMap((option) =>
      option.name ? [[option.name, option.label] as const] : [],
    ),
  );
  return scaleModes(scale.name, divisions).flatMap(({ steps, name }) => {
    const label = labelOf.get(name);
    return steps !== 0 && label
      ? [{ rootPc: mod(rootPc + steps, divisions), label }]
      : [];
  });
}
