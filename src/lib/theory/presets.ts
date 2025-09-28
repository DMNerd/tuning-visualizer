/* =========================
   Types
========================= */

export type SystemId = `${number}-TET`;
export type StringCount = 4 | 5 | 6 | 7 | 8;
export type NoteToken = string;
export type TuningArray = readonly NoteToken[];

export type PresetTunings = Readonly<
  Record<
    SystemId,
    Readonly<Record<StringCount, Readonly<Record<string, TuningArray>>>>
  >
>;

export type DefaultTunings = Readonly<
  Record<SystemId, Readonly<Record<StringCount, TuningArray>>>
>;

/* =========================
   DRY preset definition model
========================= */

type CommonPresets = Readonly<
  Partial<Record<StringCount, Readonly<Record<string, TuningArray>>>>
>;

type SystemOverrides = Readonly<
  Partial<
    Record<
      SystemId,
      Readonly<
        Partial<Record<StringCount, Readonly<Record<string, TuningArray>>>>
      >
    >
  >
>;

/* =========================
   Common presets (shared across systems)
========================= */

const COMMON_PRESETS: CommonPresets = {
  4: {
    "Bass 4 Standard (EADG)": ["G", "D", "A", "E"],
    "Bass 4 Drop D (DADG)": ["G", "D", "A", "D"],
    "Bass 4 D Standard (DGCF)": ["F", "C", "G", "D"],
    "Bass 4 C Standard (C F Bb Eb)": ["Eb", "Bb", "F", "C"],
    "Bass 4 BEAD (no G)": ["D", "A", "E", "B"],
    "Bass 4 Drop C (CGCF)": ["F", "C", "G", "C"],
    "Bass 4 Drop B (BF#BE)": ["E", "B", "F#", "B"],

    "Mandolin / Violin (GDAE)": ["E", "A", "D", "G"],
    "Mandolin — GDAD (modal D)": ["D", "A", "D", "G"],
    "Mandolin — ADAD": ["D", "A", "D", "A"],
    "Mandolin — AEAE (cross-tune)": ["E", "A", "E", "A"],
    "Mandolin — GDGD (cross-tune)": ["D", "G", "D", "G"],
    "Mandolin — ADAE (old-time)": ["E", "A", "D", "A"],

    "Tenor Banjo (CGDA)": ["A", "D", "G", "C"],
    "Ukulele (GCEA, re-entrant)": ["A", "E", "C", "G"],
    "Baritone Uke (DGBE)": ["E", "B", "G", "D"],
  },

  5: {
    "Bass 5 Standard (BEADG)": ["G", "D", "A", "E", "B"],
    "Bass 5 High C (EADGC)": ["C", "G", "D", "A", "E"],
    "Bass 5 Drop A (AEADG)": ["G", "D", "A", "E", "A"],
    "Bass 5 Low F# (F#BEAD)": ["D", "A", "E", "B", "F#"],

    "Banjo — 5-string (g D G B D)": ["D", "B", "G", "D", "G"],
  },

  6: {
    "Standard (EADGBE)": ["E", "B", "G", "D", "A", "E"],
    "Half-Step Down (Eb Ab Db Gb Bb Eb)": ["Eb", "Bb", "Gb", "Db", "Ab", "Eb"],
    "Drop D": ["E", "B", "G", "D", "A", "D"],
    "Drop C# / Db (Db Ab Db Gb Bb Eb)": ["Eb", "Bb", "Gb", "Db", "Ab", "Db"],
    "Drop C (CGCFAD)": ["D", "A", "F", "C", "G", "C"],
    "Drop B (BF#BEG#C#)": ["C#", "G#", "E", "B", "F#", "B"],
    "C Standard (C F Bb Eb G C)": ["C", "G", "Eb", "Bb", "F", "C"],
    "D Standard (DGCFAD)": ["D", "A", "F", "C", "G", "D"],

    "Baritone B Standard (BEADF#B)": ["B", "F#", "D", "A", "E", "B"],
    "Baritone A Standard (ADGCFAD)": ["A", "D", "G", "C", "F", "A"],
    "Baritone C Standard (CFBbEbGC)": ["C", "G", "Eb", "Bb", "F", "C"],
    "Baritone Drop A (AEADF#B)": ["B", "F#", "D", "A", "E", "A"],
    "Baritone Drop B (BF#BEG#C#)": ["C#", "G#", "E", "B", "F#", "B"],

    "Open G (DGDGBD)": ["D", "B", "G", "D", "G", "D"],
    "Open D (DADF#AD)": ["D", "A", "F#", "D", "A", "D"],
    "Open Dm (DADFAD)": ["D", "A", "F", "D", "A", "D"],
    "Open C (CGCGCE)": ["E", "C", "G", "C", "G", "C"],
    "Open E (EBEG#BE)": ["E", "B", "G#", "E", "B", "E"],
    "Open A (EAEAC#E)": ["E", "C#", "A", "E", "A", "E"],
    "Open B (F#BF#BD#F#)": ["F#", "D#", "B", "F#", "B", "F#"],
    "Open F (FACFAD)": ["D", "A", "F", "C", "A", "F"],

    "Double Drop D (DADGBD)": ["D", "B", "G", "D", "A", "D"],
    "All Fourths (EADGCF)": ["F", "C", "G", "D", "A", "E"],
    "Nashville High-Strung (EADGBE)": ["E", "B", "G", "D", "A", "E"],
    DADGAD: ["D", "A", "G", "D", "A", "D"],

    "Midwest Emo — Fmaj7 (FACGCE)": ["E", "C", "G", "C", "A", "F"],
    "Midwest Emo — Dmaj(add9) (DADF#AE)": ["E", "A", "F#", "D", "A", "D"],
    "Midwest Emo — Csus2 (CGDGAD)": ["D", "A", "G", "D", "G", "C"],
    "Midwest Emo — Dadd9 (DAEAC#E)": ["E", "C#", "A", "E", "A", "D"],
    "Midwest Emo — Aadd4 (EAC#EAE)": ["E", "A", "E", "C#", "A", "E"],

    "Bass 6 Standard (BEADGC)": ["C", "G", "D", "A", "E", "B"],
    "Bass 6 Low F# (F#BEADG)": ["G", "D", "A", "E", "B", "F#"],
  },

  7: {
    "Standard 7 (BEADGBE)": ["E", "B", "G", "D", "A", "E", "B"],
    "Drop A (AEADGBE)": ["E", "B", "G", "D", "A", "E", "A"],
    "Standard A (AEADGBE)": ["E", "B", "G", "D", "A", "E", "A"],
    "Drop G (GDGCFAD)": ["D", "A", "F", "C", "G", "D", "G"],

    "All Fourths 7 (EADGCF Bb)": ["Bb", "F", "C", "G", "D", "A", "E"],
  },

  8: {
    "Standard 8 (F#BEADGBE)": ["E", "B", "G", "D", "A", "E", "B", "F#"],
    "Drop E (EBEADGBE)": ["E", "B", "G", "D", "A", "E", "B", "E"],

    "Drop D (DADGCFAD)": ["D", "A", "F", "C", "G", "D", "A", "D"],
    "All Fourths 8 (EADGCF Bb Eb)": ["Eb", "Bb", "F", "C", "G", "D", "A", "E"],
  },
} as const;

/* =========================
   Per-system overrides
========================= */

const SYSTEM_OVERRIDES: SystemOverrides = {
  "24-TET": {
    4: {
      "Mandolin +Q on A (A↑)": ["E", "A↑", "D", "G"],
      "Bass 4 +Q G (G↑)": ["G↑", "D", "A", "E"],
    },
    5: { "Bass 5 +Q D (D↑)": ["G", "D↑", "A", "E", "B"] },
    6: {
      "Std +Q G string (G↑)": ["E", "B", "G↑", "D", "A", "E"],
      "Std +Q B string (B↑)": ["E", "B↑", "G", "D", "A", "E"],
      "Std −Q B string (B↓)": ["E", "B↓", "G", "D", "A", "E"],
      "Open D (quarter-bright 3rd, F#↑)": ["D", "A", "F#↑", "D", "A", "D"],
      "King Gizzard (C#F#C#F#BE)": ["E", "B", "F#", "C#", "F#", "C#"],
      "Bass 6 +Q G (G↑)": ["C", "G↑", "D", "A", "E", "B"],
    },
    7: { "Std +Q middle (G↑)": ["E", "B", "G↑", "D", "A", "E", "B"] },
    8: { "Std +Q B string (B↑)": ["E", "B↑", "G", "D", "A", "E", "B", "F#"] },
  },
};

/* =========================
   Internal utils
========================= */

function isObjectRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function freezeDeep<T>(o: T): T {
  if (!isObjectRecord(o)) return o;
  if (!Object.isFrozen(o)) Object.freeze(o);
  for (const v of Object.values(o)) {
    if (isObjectRecord(v) && !Object.isFrozen(v)) {
      freezeDeep(v);
    }
  }
  return o;
}

/* =========================
   Builders (mutable → frozen)
========================= */

function buildPresetTunings(
  systems: readonly SystemId[],
  common: CommonPresets,
  overrides: SystemOverrides,
): PresetTunings {
  const result: {
    [K in SystemId]?: Partial<Record<StringCount, Record<string, TuningArray>>>;
  } = {};

  for (const system of systems) {
    const sysOverrides = overrides[system] ?? {};
    const byCount: Partial<Record<StringCount, Record<string, TuningArray>>> =
      {};

    for (const n of [4, 5, 6, 7, 8] as const) {
      const group: Record<string, TuningArray> = {
        ...(common[n] ?? {}),
        ...(sysOverrides[n] ?? {}),
      };
      if (Object.keys(group).length > 0) byCount[n] = group;
    }

    result[system] = byCount;
  }

  return freezeDeep(result) as PresetTunings;
}

type DefaultNamesCommon = Readonly<Partial<Record<StringCount, string>>>;
type DefaultNamesBySystem = Readonly<
  Partial<Record<SystemId, Readonly<Partial<Record<StringCount, string>>>>>
>;

function materializeDefaultNames(
  systems: readonly SystemId[],
  common: DefaultNamesCommon,
  perSystem: DefaultNamesBySystem,
): Readonly<Record<SystemId, Readonly<Record<StringCount, string>>>> {
  const out: {
    [K in SystemId]?: Partial<Record<StringCount, string>>;
  } = {};

  for (const system of systems) {
    const s: Partial<Record<StringCount, string>> = {};
    for (const n of [4, 5, 6, 7, 8] as const) {
      const pick = perSystem[system]?.[n] ?? common[n];
      if (pick) s[n] = pick;
    }
    out[system] = s;
  }

  return freezeDeep(out) as Readonly<
    Record<SystemId, Readonly<Record<StringCount, string>>>
  >;
}

function makeDefaultsFromPresets(
  presets: PresetTunings,
  picks: Readonly<Record<SystemId, Readonly<Record<StringCount, string>>>>,
): DefaultTunings {
  const out: {
    [K in SystemId]?: Partial<Record<StringCount, TuningArray>>;
  } = {};

  const counts = [4, 5, 6, 7, 8] as const;

  for (const system of Object.keys(picks) as SystemId[]) {
    const s: Partial<Record<StringCount, TuningArray>> = {};
    for (const n of counts) {
      const name = picks[system][n];
      if (!name) continue;
      const group = presets[system]?.[n];
      const chosen = group?.[name];
      if (!chosen) {
        throw new Error(
          `Default preset "${name}" not found for ${system} ${n}-string.`,
        );
      }
      s[n] = chosen;
    }
    out[system] = s;
  }

  return freezeDeep(out) as DefaultTunings;
}

/* =========================
   Public helpers
========================= */

export function buildPresetStateForSystems(systems: readonly SystemId[]) {
  const PRESET_TUNINGS = buildPresetTunings(
    systems,
    COMMON_PRESETS,
    SYSTEM_OVERRIDES,
  );

  const DEFAULT_NAMES_COMMON: DefaultNamesCommon = {
    4: "Bass 4 Standard (EADG)",
    5: "Bass 5 Standard (BEADG)",
    6: "Standard (EADGBE)",
    7: "Standard 7 (BEADGBE)",
    8: "Standard 8 (F#BEADGBE)",
  } as const;

  const DEFAULT_NAMES_BY_SYSTEM: DefaultNamesBySystem = {
    // Example: "24-TET": { 6: "Std +Q B string (B↑)" },
  } as const;

  const DEFAULT_PRESET_NAME = materializeDefaultNames(
    systems,
    DEFAULT_NAMES_COMMON,
    DEFAULT_NAMES_BY_SYSTEM,
  );

  const DEFAULT_TUNINGS = makeDefaultsFromPresets(
    PRESET_TUNINGS,
    DEFAULT_PRESET_NAME,
  );

  return { PRESET_TUNINGS, DEFAULT_TUNINGS, DEFAULT_PRESET_NAME };
}

/** Convenience: derive systems from a TUNINGS-like map (keys must be `${number}-TET`). */
export function systemsFromTuningMap<T extends Record<string, unknown>>(
  tuningMap: T,
) {
  return Object.freeze(Object.keys(tuningMap) as SystemId[]);
}

/* =========================
   Back-compat fallback (12/24)
========================= */

const FALLBACK_SYSTEMS = [
  "12-TET",
  "24-TET",
] as const satisfies readonly SystemId[];
const {
  PRESET_TUNINGS: PRESET_TUNINGS_FALLBACK,
  DEFAULT_TUNINGS: DEFAULT_TUNINGS_FALLBACK,
  DEFAULT_PRESET_NAME: DEFAULT_PRESET_NAME_FALLBACK,
} = buildPresetStateForSystems(FALLBACK_SYSTEMS);

export const PRESET_TUNINGS = PRESET_TUNINGS_FALLBACK;
export const DEFAULT_TUNINGS = DEFAULT_TUNINGS_FALLBACK;
export const DEFAULT_PRESET_NAME = DEFAULT_PRESET_NAME_FALLBACK;

export const getDefaultTuning = (system: SystemId, strings: StringCount) =>
  DEFAULT_TUNINGS[system][strings];

/* =========================
   Optional per-preset meta
========================= */

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
