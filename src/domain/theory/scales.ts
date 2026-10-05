// The scales offered for each tuning system: every scale the theory engine
// has for its EDO (see tonalAdapter.ts), plus the full chromatic scale.
// Labels are persisted (theory store, routines, favourites); labels saved by
// older versions are mapped by `migrateScaleLabel`.

import { scalesForEdo } from "@domain/theory/tonalAdapter";

export type ScaleDef = {
  label: string;
  systemId: string;
  pcs: number[];
  /** The theory engine's scale name (none for the chromatic scale). */
  name?: string;
};

export const CHROMATIC_LABEL = "Chromatic";

// "harmonic minor" => "Harmonic Minor", "half-whole diminished" =>
// "Half-Whole Diminished"
const titleCase = (name: string) =>
  name.replace(
    /(^|[\s-])(\p{L})/gu,
    (_: string, sep: string, c: string) => sep + c.toUpperCase(),
  );

/**
 * Scales for a tuning system, sorted by label. Scales that come out as the
 * same notes in an EDO are listed once, under the first name the theory
 * engine lists (traditional scales come first).
 */
export function scalesForSystem(
  systemId: string,
  divisions: number,
): ScaleDef[] {
  const chromatic = Array.from({ length: Math.max(1, divisions) }, (_, i) => i);
  const scales: ScaleDef[] = [
    { label: CHROMATIC_LABEL, systemId, pcs: chromatic },
  ];
  const seen = new Set([chromatic.join(",")]);
  for (const { name, pcs } of scalesForEdo(divisions)) {
    // Tonal's chromatic scale is its 12 notes; ours has every step
    if (name === "chromatic") continue;
    const key = pcs.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    scales.push({ label: titleCase(name), systemId, pcs, name });
  }
  return scales.sort((a, b) => a.label.localeCompare(b.label));
}

// Labels of gv's own scale lists, before scales came from the theory engine.
// 24-TET labels had a "24TET " prefix.
const RENAMED: Record<string, string> = {
  "Major (Ionian)": "Major",
  "Natural Minor (Aeolian)": "Minor",
  "Melodic Minor (asc.)": "Melodic Minor",
  "Melodic Minor (asc., doubled)": "Melodic Minor",
  "Blues Minor (Hexatonic)": "Minor Blues",
  "Blues (Hexatonic, doubled)": "Minor Blues",
  "Blues Major (Hexatonic)": "Major Blues",
  "Whole Tone (Hexatonic)": "Whole Tone",
  "Diminished (H-W Octatonic)": "Half-Whole Diminished",
  "Diminished (H-W, doubled)": "Half-Whole Diminished",
  "Diminished (W-H Octatonic)": "Diminished",
  "Diminished (W-H, doubled)": "Diminished",
  "Bebop Dominant (8)": "Bebop",
  "Bebop Major (8)": "Bebop Major",
  // gv's microtonal scales, by the maqam or makam they meant
  "Uşşak (Uşşâk)": "Husayni",
  Hüseyni: "Husayni",
  "Major w/ Neutral 3rd": "Mahur",
  "Hijaz-ish": "Hijaz",
  "Neva (¾-sharp LT, KG style)": "Bayati",
  "Uşak Maṣri (Hijaz on 5th)": "Bayati",
};

// Other EDOs used to get four "Generic …-like" scales, labeled with the
// system id and size, e.g. "19-TET Generic Major-like (19)".
const LEGACY_BASELINE_LABEL =
  /^\d+-TET (?:Chromatic|Generic (.+)-like) \((\d+)\)$/;
const LEGACY_BASELINE_SCALES: Record<string, string> = {
  Major: "Major",
  Minor: "Minor",
  "Major Pentatonic": "Major Pentatonic",
  "Minor Pentatonic": "Minor Pentatonic",
};

/** Maps a scale label saved by an older version to its current label. */
export function migrateScaleLabel(label: string): string {
  const legacy = LEGACY_BASELINE_LABEL.exec(label);
  if (legacy) {
    return legacy[1]
      ? (LEGACY_BASELINE_SCALES[legacy[1]] ?? label)
      : CHROMATIC_LABEL;
  }
  const plain = label.replace(/^24TET /, "");
  if (/^Chromatic \(\d+\)$/.test(plain)) return CHROMATIC_LABEL;
  const unDoubled = plain.replace(/ \(doubled\)$/, "");
  return RENAMED[plain] ?? RENAMED[unDoubled] ?? unDoubled;
}

/**
 * Maps a favourite scale key ("<systemId>-<label>", system ids can contain
 * "-") saved by an older version to its current key.
 */
export function migrateScaleFavoriteKey(key: string): string {
  for (let at = key.indexOf("-"); at >= 0; at = key.indexOf("-", at + 1)) {
    const label = key.slice(at + 1);
    const migrated = migrateScaleLabel(label);
    if (migrated !== label) return `${key.slice(0, at)}-${migrated}`;
  }
  return key;
}
