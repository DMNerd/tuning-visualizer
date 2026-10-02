// Chord types come from the theory engine (see tonalAdapter.ts): a chord
// type is its chord symbol there, e.g. "M", "m7", "(↓3)" or "har7".
// Favourites store chord types; ones saved by older versions are mapped by
// `migrateChordType`.

import { mod } from "@shared/lib/math";
import {
  chordTypeInfo,
  chordTypesForEdo,
  intervalSteps,
} from "@domain/theory/tonalAdapter";

export type ChordType = string;

const hasArrows = (intervals: readonly string[]) =>
  intervals.some((ivl) => /[↑↓]/.test(ivl));

// "major seventh" => "Major Seventh"
const titleCase = (name: string) =>
  name.replace(
    /(^|[\s-])(\p{L})/gu,
    (_: string, sep: string, c: string) => sep + c.toUpperCase(),
  );

const offeredCache = new Map<number, Set<ChordType>>();
function offeredIn(divisions: number): Set<ChordType> {
  let offered = offeredCache.get(divisions);
  if (!offered) {
    offered = new Set(chordTypesForEdo(divisions).map(({ type }) => type));
    offeredCache.set(divisions, offered);
  }
  return offered;
}

/** Whether a chord type is offered in an EDO (it may not be in every EDO). */
export const isChordTypeOffered = (type: ChordType, divisions: number) =>
  offeredIn(divisions).has(type);

/** Label for menus, e.g. "Major Seventh · maj7", or the bare symbol. */
export function chordLabel(type: ChordType, divisions?: number): string {
  const info = chordTypeInfo(type, divisions);
  return info?.name ? `${titleCase(info.name)} · ${type}` : type;
}

/** Chord types with ups or downs, or built from ratios for each EDO. */
export function isMicrotonalChordType(type: ChordType): boolean {
  const info = chordTypeInfo(type);
  return !info || hasArrows(info.intervals);
}

/** Chord types offered in an EDO, sorted by label. */
export function chordTypesFor(divisions: number): ChordType[] {
  return [...offeredIn(divisions)].sort((a, b) =>
    chordLabel(a, divisions).localeCompare(chordLabel(b, divisions)),
  );
}

/**
 * Pitch classes of a chord. A microtonal chord in an EDO where it isn't
 * offered (ups and downs are sharps and flats there) sounds as its 12-TET
 * stand-in, the same chord without ups and downs.
 */
export function buildChordPCsFromPc(
  rootPc: number,
  type: ChordType,
  divisions: number,
): Set<number> {
  const info = chordTypeInfo(type, divisions);
  if (!info) return new Set();
  const intervals = isChordTypeOffered(type, divisions)
    ? info.intervals
    : info.intervals.map((ivl) => ivl.replace(/[↑↓]/g, ""));
  return new Set(
    intervals.map((ivl) =>
      mod(rootPc + intervalSteps(ivl, divisions), divisions),
    ),
  );
}

// Chord types of gv's own chord list, before chords came from the theory
// engine
const RENAMED: Record<string, ChordType> = {
  maj: "M",
  min: "m",
  add9: "Madd9",
  neut: "(↓3)",
  neut7: "7(↓3)",
  "sus2↓": "sus↓2",
  "sus4↑": "sus↑4",
  "maj↑3": "(↑3)",
  "min↓3": "m(↓3)",
  quartal: "7sus4no5",
};

/** Maps a chord type saved by an older version to its current symbol. */
export const migrateChordType = (type: string): ChordType =>
  RENAMED[type] ?? type;
