// constants.ts

// ---------------- Types ----------------

/** Supported tuning systems in the app. */
export type SystemId = "12-TET" | "24-TET";

/** Supported string counts. */
export type StringCount = 4 | 5 | 6 | 7 | 8;

/**
 * We keep note tokens flexible to allow microtonal markers like "A↑" / "B↓",
 * enharmonics ("Eb", "F#"), and re-entrant ukulele, etc.
 */
export type NoteToken = string;

/** A tuning is an array of note tokens, ordered high → low to match the app’s convention. */
export type TuningArray = readonly NoteToken[];

/** Default/factory tunings map. */
export type DefaultTunings = Readonly<
  Record<SystemId, Readonly<Record<StringCount, TuningArray>>>
>;

/** Named presets per system & string count. */
export type PresetTunings = Readonly<
  Record<
    SystemId,
    Readonly<Record<StringCount, Readonly<Record<string, TuningArray>>>>
  >
>;

// ---------------- Data ----------------

// Instrument bounds
export const STR_MIN = 4;
export const STR_MAX = 8;

export const FRETS_MIN = 12;
export const FRETS_MAX = 30;

export const STR_FACTORY = 6;
export const FRETS_FACTORY = 22;

/**
 * Named (built-in) presets per temperament & string count.
 * Keys are human-friendly names shown in the UI.
 * Arrays are ordered high → low to match the app’s convention.
 */
export const PRESET_TUNINGS: PresetTunings = {
  "12-TET": {
    // 4-string: common double-courses & short-scale instruments
    4: {
      "Mandolin / Violin (GDAE)": ["E", "A", "D", "G"],
      "Tenor Banjo (CGDA)": ["A", "D", "G", "C"],
      "Ukulele (GCEA, re-entrant)": ["A", "E", "C", "G"],
      "Baritone Uke (DGBE)": ["E", "B", "G", "D"],

      // Bass (4)
      "Bass 4 Standard (EADG)": ["G", "D", "A", "E"],
      "Bass 4 Drop D (DADG)": ["G", "D", "A", "D"],
      "Bass 4 D Standard (DGCF)": ["F", "C", "G", "D"],
      "Bass 4 C Standard (C F Bb Eb)": ["Eb", "Bb", "F", "C"],
      "Bass 4 BEAD (no G)": ["D", "A", "E", "B"],
    },

    // 5-string bass
    5: {
      "Bass 5 Standard (BEADG)": ["G", "D", "A", "E", "B"],
      "Bass 5 High C (EADGC)": ["C", "G", "D", "A", "E"],
      "Bass 5 Drop A (AEADG)": ["G", "D", "A", "E", "A"],
      "Bass 5 Low F# (F#BEAD)": ["D", "A", "E", "B", "F#"],
      "Banjo — 5-string (g D G B D)": ["D", "B", "G", "D", "G"],
    },

    // 6-string guitar
    6: {
      "Standard (EADGBE)": ["E", "B", "G", "D", "A", "E"],
      "Drop D": ["E", "B", "G", "D", "A", "D"],
      DADGAD: ["D", "A", "G", "D", "A", "D"],
      "Open G (DGDGBD)": ["D", "B", "G", "D", "G", "D"],
      "Open D (DADF#AD)": ["D", "A", "F#", "D", "A", "D"],
      "Open C (CGCGCE)": ["E", "C", "G", "C", "G", "C"],
      "Open E (EBEG#BE)": ["E", "B", "G#", "E", "B", "E"],
      "All Fourths (EADGCF)": ["F", "C", "G", "D", "A", "E"],
      "Half-Step Down (Eb Ab Db Gb Bb Eb)": [
        "Eb",
        "Bb",
        "Gb",
        "Db",
        "Ab",
        "Eb",
      ],
      "C Standard (C F Bb Eb G C)": ["C", "G", "Eb", "Bb", "F", "C"],
      "Open A (EAEAC#E)": ["E", "C#", "A", "E", "A", "E"],
      "Open B (F#BF#B D# F#)": ["F#", "D#", "B", "F#", "B", "F#"],

      // Bass (6) — included here for 6-string count
      "Bass 6 Standard (BEADGC)": ["C", "G", "D", "A", "E", "B"],
    },

    // 7-string guitar
    7: {
      "Standard 7 (BEADGBE)": ["E", "B", "G", "D", "A", "E", "B"],
      "Drop A (AEADGBE)": ["E", "B", "G", "D", "A", "E", "A"],
      "All Fourths 7 (EADGCF Bb)": ["Bb", "F", "C", "G", "D", "A", "E"],
    },

    // 8-string guitar
    8: {
      "Standard 8 (F#BEADGBE)": ["E", "B", "G", "D", "A", "E", "B", "F#"],
      "Drop E (EBEADGBE)": ["E", "B", "G", "D", "A", "E", "B", "E"],
      "All Fourths 8 (EADGCF Bb Eb)": [
        "Eb",
        "Bb",
        "F",
        "C",
        "G",
        "D",
        "A",
        "E",
      ],
    },
  },

  "24-TET": {
    // 4-string
    4: {
      "Mandolin / Violin (GDAE)": ["E", "A", "D", "G"],
      "Tenor Banjo (CGDA)": ["A", "D", "G", "C"],
      "Ukulele (GCEA, re-entrant)": ["A", "E", "C", "G"],

      // Microtonal flavors (quarter-tone accents)
      "Mandolin +Q on A (A↑)": ["E", "A↑", "D", "G"],

      // Bass (4)
      "Bass 4 Standard (EADG)": ["G", "D", "A", "E"],
      "Bass 4 Drop D (DADG)": ["G", "D", "A", "D"],
      "Bass 4 D Standard (DGCF)": ["F", "C", "G", "D"],
      "Bass 4 C Standard (C F Bb Eb)": ["Eb", "Bb", "F", "C"],
      "Bass 4 BEAD (no G)": ["D", "A", "E", "B"],
      "Bass 4 +Q G (G↑)": ["G↑", "D", "A", "E"],
    },

    // 5-string bass
    5: {
      "Bass 5 Standard (BEADG)": ["G", "D", "A", "E", "B"],
      "Bass 5 High C (EADGC)": ["C", "G", "D", "A", "E"],
      "Bass 5 Drop A (AEADG)": ["G", "D", "A", "E", "A"],
      "Bass 5 Low F# (F#BEAD)": ["D", "A", "E", "B", "F#"],
      "Bass 5 +Q D (D↑)": ["G", "D↑", "A", "E", "B"],
    },

    // 6-string (guitar + bass)
    6: {
      // Guitar
      "Standard (EADGBE)": ["E", "B", "G", "D", "A", "E"],
      "Drop D": ["E", "B", "G", "D", "A", "D"],
      DADGAD: ["D", "A", "G", "D", "A", "D"],
      "Std +Q G string (G↑)": ["E", "B", "G↑", "D", "A", "E"],
      "Std +Q B string (B↑)": ["E", "B↑", "G", "D", "A", "E"],
      "Std −Q B string (B↓)": ["E", "B↓", "G", "D", "A", "E"],
      "Open D (quarter-bright 3rd, F#↑)": ["D", "A", "F#↑", "D", "A", "D"],

      // King Gizzard preset
      "King Gizzard (C#F#C#F#BE)": ["E", "B", "F#", "C#", "F#", "C#"],

      // Bass (6)
      "Bass 6 Standard (BEADGC)": ["C", "G", "D", "A", "E", "B"],
      "Bass 6 +Q G (G↑)": ["C", "G↑", "D", "A", "E", "B"],
    },

    7: {
      "Standard 7 (BEADGBE)": ["E", "B", "G", "D", "A", "E", "B"],
      "Drop A": ["E", "B", "G", "D", "A", "E", "A"],
      "Std +Q middle (G↑)": ["E", "B", "G↑", "D", "A", "E", "B"],
    },

    8: {
      "Standard 8 (F#BEADGBE)": ["E", "B", "G", "D", "A", "E", "B", "F#"],
      "Drop E 8": ["E", "B", "G", "D", "A", "E", "B", "E"],
      "Std +Q B string (B↑)": ["E", "B↑", "G", "D", "A", "E", "B", "F#"],
    },
  },
} as const satisfies PresetTunings;

// ---------------- Choose which preset is the factory default ----------------

/** Name of the preset to use as the default per system & string count. */
const DEFAULT_PRESET_NAME: Readonly<
  Record<SystemId, Readonly<Record<StringCount, string>>>
> = {
  "12-TET": {
    4: "Bass 4 Standard (EADG)",
    5: "Bass 5 Standard (BEADG)",
    6: "Standard (EADGBE)",
    7: "Standard 7 (BEADGBE)",
    8: "Standard 8 (F#BEADGBE)",
  },
  "24-TET": {
    4: "Bass 4 Standard (EADG)",
    5: "Bass 5 Standard (BEADG)",
    6: "Standard (EADGBE)",
    7: "Standard 7 (BEADGBE)",
    8: "Standard 8 (F#BEADGBE)",
  },
} as const;

/** Build DEFAULT_TUNINGS by selecting from PRESET_TUNINGS. */
function makeDefaultsFromPresets(
  presets: PresetTunings,
  picks: typeof DEFAULT_PRESET_NAME,
): DefaultTunings {
  const out: Partial<
    Record<SystemId, Partial<Record<StringCount, TuningArray>>>
  > = {};

  (Object.keys(picks) as SystemId[]).forEach((system) => {
    out[system] = {};
    (Object.keys(picks[system]) as unknown as StringCount[]).forEach((n) => {
      const presetName = picks[system][n];
      const group = presets[system][n];
      const chosen = group[presetName];

      if (!chosen) {
        throw new Error(
          `Default preset "${presetName}" not found for ${system} ${n}-string.`,
        );
      }
      out[system]![n] = chosen;
    });
  });

  return out as DefaultTunings;
}

export const PRESET_TUNING_META: Record<
  string,
  Record<
    number,
    Record<
      string,
      { index: number; startFret?: number; greyBefore?: boolean }[]
    >
  >
> = {
  "12-TET": {
    5: {
      "Banjo — 5-string (g D G B D)": [
        { index: 4, startFret: 5, greyBefore: true },
      ],
    },
  },
};

export const DEFAULT_TUNINGS: DefaultTunings = makeDefaultsFromPresets(
  PRESET_TUNINGS,
  DEFAULT_PRESET_NAME,
);

export const getDefaultTuning = (system: SystemId, strings: StringCount) =>
  DEFAULT_TUNINGS[system][strings];
