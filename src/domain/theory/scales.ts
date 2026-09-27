// The scales offered for each tuning system. Scale formulas come from the
// theory engine (see tonalAdapter.ts): standard scales from its dictionary,
// gv's own microtonal scales from the interval spellings below. Labels are
// persisted (theory store, routines), so the 12- and 24-TET ones must not
// change.

import {
  pcsForIntervals,
  scaleIntervals,
  supportsMicrotonal,
} from "@domain/theory/tonalAdapter";

export type ScaleDef = {
  label: string;
  systemId: string;
  pcs: number[];
};

type StandardScale = {
  /** Scale name in the theory engine's dictionary. */
  scale: string;
  label: string;
  /** Label in the 24-TET list; omitted when 24-TET doesn't offer it. */
  label24?: string;
};

// Order is the order shown in the 12-TET list.
const STANDARD_SCALES: StandardScale[] = [
  {
    scale: "major",
    label: "Major (Ionian)",
    label24: "24TET Major (Ionian)",
  },
  {
    scale: "minor",
    label: "Natural Minor (Aeolian)",
    label24: "24TET Natural Minor (Aeolian)",
  },
  {
    scale: "harmonic minor",
    label: "Harmonic Minor",
    label24: "24TET Harmonic Minor",
  },
  { scale: "dorian", label: "Dorian", label24: "24TET Dorian (doubled)" },
  {
    scale: "phrygian",
    label: "Phrygian",
    label24: "24TET Phrygian (doubled)",
  },
  { scale: "lydian", label: "Lydian", label24: "24TET Lydian (doubled)" },
  {
    scale: "mixolydian",
    label: "Mixolydian",
    label24: "24TET Mixolydian (doubled)",
  },
  { scale: "locrian", label: "Locrian", label24: "24TET Locrian (doubled)" },
  {
    scale: "melodic minor",
    label: "Melodic Minor (asc.)",
    label24: "24TET Melodic Minor (asc., doubled)",
  },
  {
    scale: "harmonic major",
    label: "Harmonic Major",
    label24: "24TET Harmonic Major (doubled)",
  },
  {
    scale: "double harmonic major",
    label: "Double Harmonic Major",
    label24: "24TET Double Harmonic Major (doubled)",
  },
  {
    scale: "hungarian minor",
    label: "Hungarian Minor",
    label24: "24TET Hungarian Minor (doubled)",
  },
  {
    scale: "phrygian dominant",
    label: "Phrygian Dominant",
    label24: "24TET Phrygian Dominant (doubled)",
  },
  {
    scale: "major pentatonic",
    label: "Major Pentatonic",
    label24: "24TET Major Pentatonic (doubled)",
  },
  {
    scale: "minor pentatonic",
    label: "Minor Pentatonic",
    label24: "24TET Minor Pentatonic (doubled)",
  },
  {
    scale: "minor blues",
    label: "Blues Minor (Hexatonic)",
    label24: "24TET Blues (Hexatonic, doubled)",
  },
  { scale: "major blues", label: "Blues Major (Hexatonic)" },
  {
    scale: "whole tone",
    label: "Whole Tone (Hexatonic)",
    label24: "24TET Whole Tone (doubled)",
  },
  {
    scale: "half-whole diminished",
    label: "Diminished (H-W Octatonic)",
    label24: "24TET Diminished (H-W, doubled)",
  },
  {
    scale: "diminished",
    label: "Diminished (W-H Octatonic)",
    label24: "24TET Diminished (W-H, doubled)",
  },
  { scale: "bebop", label: "Bebop Dominant (8)" },
  { scale: "bebop major", label: "Bebop Major (8)" },
];

// gv's own microtonal scales, in ups and downs (↓2M is a second lowered by
// one step: a quarter tone in 24-TET). The 24-TET list shows them first.
const MICROTONAL_SCALES: { label: string; intervals: string }[] = [
  { label: "Hijaz-ish", intervals: "1P ↓2M 4P 5d 6m 6M 7M" },
  { label: "Uşşak (Uşşâk)", intervals: "1P ↓2M 3m 4P 5P ↓6M 7m" },
  { label: "Hüseyni", intervals: "1P ↓2M 3m 4P 5P 6M 7m" },
  {
    label: "Uşak Maṣri (Hijaz on 5th)",
    intervals: "1P ↓2M 3m 4P 5P 6m ↑7m",
  },
  {
    label: "Neva (¾-sharp LT, KG style)",
    intervals: "1P ↓2M 3m 4P 5P 6M ↑7m",
  },
  { label: "Neutral Heptatonic", intervals: "1P 2M ↓3M 5d 6m ↑6M 7M" },
  { label: "Major w/ Neutral 3rd", intervals: "1P 2M ↓3M 4P 5P 6M 7M" },
  { label: "Minor w/ Neutral 6th", intervals: "1P 2M 3m 4P 5P ↓6M 7m" },
  { label: "Neutral Pentatonic", intervals: "1P 2M ↑3M 5P ↑6M" },
];

const LABEL_PREFIX_24 = "24TET ";

function chromatic(systemId: string, divisions: number, label: string) {
  return {
    label,
    systemId,
    pcs: Array.from({ length: Math.max(1, divisions) }, (_, i) => i),
  };
}

const standardPcs = (entry: StandardScale, divisions: number) =>
  pcsForIntervals(scaleIntervals(entry.scale), divisions);
const microtonalPcs = (intervals: string, divisions: number) =>
  pcsForIntervals(intervals.split(" "), divisions);

/**
 * Scales for a tuning system. 12- and 24-TET have their curated lists;
 * other EDOs get the chromatic scale, the standard scales and, where ups
 * and downs are distinct from sharps and flats, gv's microtonal scales.
 * There, scales that come out as the same notes are listed once.
 */
export function scalesForSystem(
  systemId: string,
  divisions: number,
): ScaleDef[] {
  if (divisions === 12) {
    // The chromatic scale is listed after the octatonic scales
    return STANDARD_SCALES.flatMap((entry) => {
      const scale = {
        label: entry.label,
        systemId,
        pcs: standardPcs(entry, 12),
      };
      return entry.scale === "diminished"
        ? [scale, chromatic(systemId, 12, "Chromatic (12)")]
        : [scale];
    });
  }

  if (divisions === 24) {
    return [
      ...MICROTONAL_SCALES.map(({ label, intervals }) => ({
        label: `${LABEL_PREFIX_24}${label}`,
        systemId,
        pcs: microtonalPcs(intervals, 24),
      })),
      ...STANDARD_SCALES.flatMap((entry) =>
        entry.label24
          ? [{ label: entry.label24, systemId, pcs: standardPcs(entry, 24) }]
          : [],
      ),
      chromatic(systemId, 24, `${LABEL_PREFIX_24}Chromatic (24)`),
    ];
  }

  const scales = [
    chromatic(systemId, divisions, `Chromatic (${divisions})`),
    ...STANDARD_SCALES.map((entry) => ({
      label: entry.label,
      systemId,
      pcs: standardPcs(entry, divisions),
    })),
    ...(supportsMicrotonal(divisions)
      ? MICROTONAL_SCALES.map(({ label, intervals }) => ({
          label,
          systemId,
          pcs: microtonalPcs(intervals, divisions),
        }))
      : []),
  ];
  const seen = new Set<string>();
  return scales.filter(({ pcs }) => {
    const key = pcs.join(",");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Other EDOs used to get four "Generic …-like" scales, labeled with the
// system id and size, e.g. "19-TET Generic Major-like (19)".
const LEGACY_BASELINE_LABEL =
  /^\d+-TET (?:Chromatic|Generic (.+)-like) \((\d+)\)$/;
const LEGACY_BASELINE_SCALES: Record<string, string> = {
  Major: "Major (Ionian)",
  Minor: "Natural Minor (Aeolian)",
  "Major Pentatonic": "Major Pentatonic",
  "Minor Pentatonic": "Minor Pentatonic",
};

/** Maps a scale label saved by an older version to its current label. */
export function migrateScaleLabel(label: string): string {
  const match = LEGACY_BASELINE_LABEL.exec(label);
  if (!match) return label;
  const [, generic, divisions] = match;
  if (!generic) return `Chromatic (${divisions})`;
  return LEGACY_BASELINE_SCALES[generic] ?? label;
}
