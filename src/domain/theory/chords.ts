import { mod } from "@shared/lib/math";
import { intervalSteps, supportsMicrotonal } from "@domain/theory/tonalAdapter";

export type ChordType =
  // Standard triads & sevenths
  | "maj"
  | "min"
  | "dim"
  | "aug"
  | "sus2"
  | "sus4"
  | "6"
  | "m6"
  | "7"
  | "maj7"
  | "m7"
  | "m7b5"
  | "dim7"
  | "add9"
  // 24-EDO specific (also have 12-TET fallbacks so UI doesn’t break)
  | "neut" // neutral triad: 1 n3 5
  | "neut7" // 1 n3 5 b7
  | "sus2↓" // 1 2↓ 5
  | "sus4↑" // 1 4↑ 5
  | "maj↑3" // 1 3↑ 5
  | "min↓3" // 1 b3↓ 5
  | "quartal"; // 1 4 7♭ (stacked fourths)

const MICROTONAL_TYPES: readonly ChordType[] = [
  "neut",
  "neut7",
  "sus2↓",
  "sus4↑",
  "maj↑3",
  "min↓3",
] as const;

const MICROTONAL_TYPE_SET = new Set<ChordType>(MICROTONAL_TYPES);
export const isMicrotonalChordType = (type: ChordType): boolean =>
  MICROTONAL_TYPE_SET.has(type);

interface ChordDef {
  label: string;
  /** Intervals in ups and downs notation (see vendor/microtonal). */
  intervals: string;
  /**
   * 12-TET stand-in for microtonal chords (the closest conventional sound),
   * so switching systems doesn't break the UI.
   */
  fallback?: string;
}

const CHORDS: Record<ChordType, ChordDef> = {
  // ---- Standard library ----
  maj: { label: "Major (1 3 5)", intervals: "1P 3M 5P" },
  min: { label: "Minor (1 ♭3 5)", intervals: "1P 3m 5P" },
  dim: { label: "Diminished (1 ♭3 ♭5)", intervals: "1P 3m 5d" },
  aug: { label: "Augmented (1 3 #5)", intervals: "1P 3M 5A" },
  sus2: { label: "Sus2 (1 2 5)", intervals: "1P 2M 5P" },
  sus4: { label: "Sus4 (1 4 5)", intervals: "1P 4P 5P" },
  "6": { label: "6 (1 3 5 6)", intervals: "1P 3M 5P 6M" },
  m6: { label: "m6 (1 ♭3 5 6)", intervals: "1P 3m 5P 6M" },
  "7": { label: "7 (1 3 5 ♭7)", intervals: "1P 3M 5P 7m" },
  maj7: { label: "Maj7 (1 3 5 7)", intervals: "1P 3M 5P 7M" },
  m7: { label: "m7 (1 ♭3 5 ♭7)", intervals: "1P 3m 5P 7m" },
  m7b5: { label: "m7♭5 (1 ♭3 ♭5 ♭7)", intervals: "1P 3m 5d 7m" },
  dim7: { label: "Dim7 (1 ♭3 ♭5 6)", intervals: "1P 3m 5d 7d" },
  add9: { label: "Add9 (1 3 5 9)", intervals: "1P 3M 5P 9M" },

  // ---- Microtonal extensions ----
  neut: {
    label: "Neutral (1 n3 5)",
    intervals: "1P ↓3M 5P",
    fallback: "1P 3M 5P",
  },
  neut7: {
    label: "Neutral7 (1 n3 5 ♭7)",
    intervals: "1P ↓3M 5P 7m",
    fallback: "1P 3M 5P 7m",
  },
  "sus2↓": {
    label: "Sus2↓ (1 2↓ 5)",
    intervals: "1P ↓2M 5P",
    fallback: "1P 2M 5P",
  },
  "sus4↑": {
    label: "Sus4↑ (1 4↑ 5)",
    intervals: "1P ↑4P 5P",
    fallback: "1P 4P 5P",
  },
  "maj↑3": {
    label: "Maj↑3 (1 3↑ 5)",
    intervals: "1P ↑3M 5P",
    fallback: "1P 3M 5P",
  },
  "min↓3": {
    label: "Min↓3 (1 ♭3↓ 5)",
    intervals: "1P ↓3m 5P",
    fallback: "1P 3m 5P",
  },
  quartal: { label: "Quartal (1 4 7♭)", intervals: "1P 4P 7m" },
};

const stepsOf = (intervals: string, divisions: number): number[] =>
  intervals.split(" ").map((ivl) => intervalSteps(ivl, divisions));

/**
 * Steps from the root in `divisions`, sized by the theory engine (stacked
 * fifths where the EDO's fifths fit, 12-TET scaled proportionally elsewhere).
 * Microtonal chords use their 12-TET stand-in where ups and downs aren't
 * distinct from sharps and flats.
 */
function chordSteps(type: ChordType, divisions: number): number[] {
  const { intervals, fallback } = CHORDS[type];
  const spelled =
    fallback && !supportsMicrotonal(divisions) ? fallback : intervals;
  return stepsOf(spelled, divisions);
}

export function buildChordPCsFromPc(
  rootPc: number,
  type: ChordType,
  divisions: number,
): Set<number> {
  if (!CHORDS[type]) return new Set();
  return new Set(
    chordSteps(type, divisions).map((s) => mod(rootPc + s, divisions)),
  );
}

/** Convenience: list & labels for UIs */
const ALL_CHORD_TYPES = Object.keys(CHORDS) as ChordType[];
export const CHORD_TYPES = ALL_CHORD_TYPES;
export const MICROTONAL_CHORD_TYPES = MICROTONAL_TYPES;
export const STANDARD_CHORD_TYPES = ALL_CHORD_TYPES.filter(
  (t) => !isMicrotonalChordType(t),
);
export const CHORD_LABELS: Record<ChordType, string> = Object.fromEntries(
  ALL_CHORD_TYPES.map((t) => [t, CHORDS[t].label]),
) as Record<ChordType, string>;
