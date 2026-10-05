// Chords and modes of a scale, from the theory engine's chord types and
// scale dictionary (see tonalAdapter.ts).

import { mod } from "@shared/lib/math";
import type { ScaleDef } from "@domain/theory/scales";
import {
  chordTypesForEdo,
  degreeNumeral,
  intervalSteps,
  scaleModes,
} from "@domain/theory/tonalAdapter";

export interface DegreeChords {
  degree: number;
  /**
   * Roman numeral of the degree, with the quality of its first chord:
   * "IV", "ii", "vii°", "III+", "♭VII".
   */
  numeral: string;
  rootPc: number;
  /** Chord types on this degree whose notes are all in the scale. */
  types: string[];
}

/**
 * The common chords (triads and sevenths of the core chord types, and the
 * less common triads such as augmented) built on each degree of a scale,
 * using only notes of the scale.
 */
export function chordsInScale(
  rootPc: number,
  scaleIntervals: readonly number[],
  divisions: number,
  perDegree = 3,
): DegreeChords[] {
  const scale = new Set(scaleIntervals.map((step) => mod(step, divisions)));
  const types = chordTypesForEdo(divisions).map((info) => ({
    ...info,
    steps: info.intervals.map((ivl) => intervalSteps(ivl, divisions)),
  }));
  // the same notes in any position, e.g. "0,3,8" for both m#5 and M on E
  const shape = (steps: readonly number[]) =>
    steps
      .map((root) =>
        steps
          .map((step) => mod(step - root, divisions))
          .sort((a, b) => a - b)
          .join(","),
      )
      .sort()[0];
  const coreShapes = new Set(
    types.filter(({ tier }) => tier === 0).map(({ steps }) => shape(steps)),
  );
  const candidates = types
    // the core chords, plus less common triads that aren't a core chord in
    // another position (augmented, but not m#5)
    .filter(
      ({ tier, steps }) =>
        (tier === 0 && steps.length <= 4) ||
        (tier === 1 && steps.length === 3 && !coreShapes.has(shape(steps))),
    )
    .map(({ type, intervals, quality, tier, steps }) => ({
      type,
      quality,
      tier,
      steps,
      // chords with a third before suspended ones
      suspended: !intervals.some((ivl) => /^[↑↓]*3/.test(ivl)),
    }))
    .sort(
      (a, b) =>
        Number(a.suspended) - Number(b.suspended) ||
        a.steps.length - b.steps.length ||
        a.tier - b.tier,
    );

  return [...scale]
    .sort((a, b) => a - b)
    .map((degreeStep, index) => {
      const fitting = candidates
        .filter(({ steps }) =>
          steps.every((step) => scale.has(mod(degreeStep + step, divisions))),
        )
        .slice(0, perDegree);
      return {
        degree: index + 1,
        numeral: withQuality(
          degreeNumeral(degreeStep, divisions),
          fitting[0]?.quality,
        ),
        rootPc: mod(rootPc + degreeStep, divisions),
        types: fitting.map(({ type }) => type),
      };
    });
}

// "III" => "iii" for minor, "iii°" for diminished, "III+" for augmented
function withQuality(numeral: string, quality?: string): string {
  const lower = numeral.replace(/[IVX]+/, (roman) => roman.toLowerCase());
  if (quality === "Minor") return lower;
  if (quality === "Diminished") return `${lower}°`;
  if (quality === "Augmented") return `${numeral}+`;
  return numeral;
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
