type ChordType =
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

interface ChordFormula {
  label: string;
  /** Steps from the root in system divisions (EDO steps). */
  steps: number[];
  /** Degree strings aligned with steps (UI helper only). */
  degrees: string[];
}

/**
 * For each chord type we provide explicit 12 and 24 step sets.
 * For 24-only ideas we still include a 12-TET fallback (closest conventional sound)
 * so changing systems doesn’t break the UI.
 */
const BASE: Record<ChordType, { "12": ChordFormula; "24": ChordFormula }> = {
  // ---- Standard library ----
  maj: {
    "12": {
      label: "Major (1 3 5)",
      steps: [0, 4, 7],
      degrees: ["1", "3", "5"],
    },
    "24": {
      label: "Major (1 3 5)",
      steps: [0, 8, 14],
      degrees: ["1", "3", "5"],
    },
  },
  min: {
    "12": {
      label: "Minor (1 ♭3 5)",
      steps: [0, 3, 7],
      degrees: ["1", "b3", "5"],
    },
    "24": {
      label: "Minor (1 ♭3 5)",
      steps: [0, 6, 14],
      degrees: ["1", "b3", "5"],
    },
  },
  dim: {
    "12": {
      label: "Diminished (1 ♭3 ♭5)",
      steps: [0, 3, 6],
      degrees: ["1", "b3", "b5"],
    },
    "24": {
      label: "Diminished (1 ♭3 ♭5)",
      steps: [0, 6, 12],
      degrees: ["1", "b3", "b5"],
    },
  },
  aug: {
    "12": {
      label: "Augmented (1 3 #5)",
      steps: [0, 4, 8],
      degrees: ["1", "3", "#5"],
    },
    "24": {
      label: "Augmented (1 3 #5)",
      steps: [0, 8, 16],
      degrees: ["1", "3", "#5"],
    },
  },
  sus2: {
    "12": {
      label: "Sus2 (1 2 5)",
      steps: [0, 2, 7],
      degrees: ["1", "2", "5"],
    },
    "24": {
      label: "Sus2 (1 2 5)",
      steps: [0, 4, 14],
      degrees: ["1", "2", "5"],
    },
  },
  sus4: {
    "12": {
      label: "Sus4 (1 4 5)",
      steps: [0, 5, 7],
      degrees: ["1", "4", "5"],
    },
    "24": {
      label: "Sus4 (1 4 5)",
      steps: [0, 10, 14],
      degrees: ["1", "4", "5"],
    },
  },
  "6": {
    "12": {
      label: "6 (1 3 5 6)",
      steps: [0, 4, 7, 9],
      degrees: ["1", "3", "5", "6"],
    },
    "24": {
      label: "6 (1 3 5 6)",
      steps: [0, 8, 14, 18],
      degrees: ["1", "3", "5", "6"],
    },
  },
  m6: {
    "12": {
      label: "m6 (1 ♭3 5 6)",
      steps: [0, 3, 7, 9],
      degrees: ["1", "b3", "5", "6"],
    },
    "24": {
      label: "m6 (1 ♭3 5 6)",
      steps: [0, 6, 14, 18],
      degrees: ["1", "b3", "5", "6"],
    },
  },
  "7": {
    "12": {
      label: "7 (1 3 5 ♭7)",
      steps: [0, 4, 7, 10],
      degrees: ["1", "3", "5", "b7"],
    },
    "24": {
      label: "7 (1 3 5 ♭7)",
      steps: [0, 8, 14, 20],
      degrees: ["1", "3", "5", "b7"],
    },
  },
  maj7: {
    "12": {
      label: "Maj7 (1 3 5 7)",
      steps: [0, 4, 7, 11],
      degrees: ["1", "3", "5", "7"],
    },
    "24": {
      label: "Maj7 (1 3 5 7)",
      steps: [0, 8, 14, 22],
      degrees: ["1", "3", "5", "7"],
    },
  },
  m7: {
    "12": {
      label: "m7 (1 ♭3 5 ♭7)",
      steps: [0, 3, 7, 10],
      degrees: ["1", "b3", "5", "b7"],
    },
    "24": {
      label: "m7 (1 ♭3 5 ♭7)",
      steps: [0, 6, 14, 20],
      degrees: ["1", "b3", "5", "b7"],
    },
  },
  m7b5: {
    "12": {
      label: "m7♭5 (1 ♭3 ♭5 ♭7)",
      steps: [0, 3, 6, 10],
      degrees: ["1", "b3", "b5", "b7"],
    },
    "24": {
      label: "m7♭5 (1 ♭3 ♭5 ♭7)",
      steps: [0, 6, 12, 20],
      degrees: ["1", "b3", "b5", "b7"],
    },
  },
  dim7: {
    "12": {
      label: "Dim7 (1 ♭3 ♭5 6)",
      steps: [0, 3, 6, 9],
      degrees: ["1", "b3", "b5", "6"],
    },
    "24": {
      label: "Dim7 (1 ♭3 ♭5 6)",
      steps: [0, 6, 12, 18],
      degrees: ["1", "b3", "b5", "6"],
    },
  },
  add9: {
    "12": {
      label: "Add9 (1 3 5 9)",
      steps: [0, 4, 7, 14],
      degrees: ["1", "3", "5", "9"],
    },
    "24": {
      label: "Add9 (1 3 5 9)",
      steps: [0, 8, 14, 28],
      degrees: ["1", "3", "5", "9"],
    },
  },

  // ---- Microtonal extensions ----
  neut: {
    "12": {
      label: "Neutral (1 3 5)",
      steps: [0, 4, 7],
      degrees: ["1", "3", "5"],
    },
    "24": {
      label: "Neutral (1 n3 5)",
      steps: [0, 7, 14],
      degrees: ["1", "n3", "5"],
    },
  },
  neut7: {
    "12": {
      label: "Neutral7 (1 3 5 ♭7)",
      steps: [0, 4, 7, 10],
      degrees: ["1", "3", "5", "b7"],
    },
    "24": {
      label: "Neutral7 (1 n3 5 ♭7)",
      steps: [0, 7, 14, 20],
      degrees: ["1", "n3", "5", "b7"],
    },
  },
  "sus2↓": {
    "12": {
      label: "Sus2 (1 2 5)",
      steps: [0, 2, 7],
      degrees: ["1", "2", "5"],
    },
    "24": {
      label: "Sus2↓ (1 2↓ 5)",
      steps: [0, 3, 14],
      degrees: ["1", "2↓", "5"],
    },
  },
  "sus4↑": {
    "12": {
      label: "Sus4 (1 4 5)",
      steps: [0, 5, 7],
      degrees: ["1", "4", "5"],
    },
    "24": {
      label: "Sus4↑ (1 4↑ 5)",
      steps: [0, 11, 14],
      degrees: ["1", "4↑", "5"],
    },
  },
  "maj↑3": {
    "12": {
      label: "Major (1 3 5)",
      steps: [0, 4, 7],
      degrees: ["1", "3", "5"],
    },
    "24": {
      label: "Maj↑3 (1 3↑ 5)",
      steps: [0, 9, 14],
      degrees: ["1", "3↑", "5"],
    },
  },
  "min↓3": {
    "12": {
      label: "Minor (1 ♭3 5)",
      steps: [0, 3, 7],
      degrees: ["1", "b3", "5"],
    },
    "24": {
      label: "Min↓3 (1 ♭3↓ 5)",
      steps: [0, 5, 14],
      degrees: ["1", "b3↓", "5"],
    },
  },
  quartal: {
    "12": {
      label: "Quartal (1 4 7♭)",
      steps: [0, 5, 10],
      degrees: ["1", "4", "b7"],
    },
    "24": {
      label: "Quartal (1 4 7♭)",
      steps: [0, 10, 20],
      degrees: ["1", "4", "b7"],
    },
  },
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

export function buildChordPCsFromPc(
  rootPc: number,
  type: ChordType,
  divisions: number,
): Set<number> {
  const f = BASE[type]?.[String(divisions) as "12" | "24"];
  if (!f) return new Set();
  return new Set(f.steps.map((s) => mod(rootPc + s, divisions)));
}

/** Convenience: list & labels for UIs */
const ALL_CHORD_TYPES = Object.keys(BASE) as ChordType[];
export const CHORD_TYPES = ALL_CHORD_TYPES;
export const MICROTONAL_CHORD_TYPES = MICROTONAL_TYPES;
export const STANDARD_CHORD_TYPES = ALL_CHORD_TYPES.filter(
  (t) => !MICROTONAL_TYPE_SET.has(t),
);
export const CHORD_LABELS: Record<ChordType, string> = Object.fromEntries(
  ALL_CHORD_TYPES.map((t) => [t, BASE[t]["24"].label]), // show 24-EDO names; still fine in 12-TET
) as Record<ChordType, string>;

/**
 * Degree label helper for showing chord degrees when desired.
 * For 24-EDO we collapse to the nearest 12-TET degree for readability.
 */
export function degreeForStep(step: number, divisions: number): string {
  const degreeFor12 = (semi: number): string => {
    switch (mod(semi, 12)) {
      case 0:
        return "1";
      case 1:
        return "b2";
      case 2:
        return "2";
      case 3:
        return "b3";
      case 4:
        return "3";
      case 5:
        return "4";
      case 6:
        return "b5";
      case 7:
        return "5";
      case 8:
        return "#5";
      case 9:
        return "6";
      case 10:
        return "b7";
      case 11:
        return "7";
      default:
        return "?";
    }
  };

  if (divisions === 12) return degreeFor12(step);

  const mapped = Math.round((step / divisions) * 12);
  return degreeFor12(mapped);
}
