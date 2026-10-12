// Chord types come from the theory engine (see tonalAdapter.ts): a chord
// type is its chord symbol there, in Kite's notation, e.g. "M", "m7", "↓",
// "~" or "har7". Favourites store chord types; ones saved by older versions
// are mapped by `migrateChordType`.

import { mod } from "@shared/lib/math";
import {
  chordTypeInfo,
  chordTypesForEdo,
  edoInfo,
  intervalSteps,
} from "@domain/theory/tonalAdapter";

export type ChordType = string;

const hasArrows = (intervals: readonly string[]) =>
  intervals.some((ivl) => /[↑↓~]/.test(ivl));

// EDOs with ups and downs finer than a sharp have microtonal chords
const hasMicrotonalChords = (divisions: number) => {
  const { spelling, sharpSteps } = edoInfo(divisions);
  return spelling === "fifths" && sharpSteps >= 2;
};

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

/**
 * Whether a chord type is offered in an EDO (it may not be in every EDO).
 * The picker lists one name per set of notes (24-EDO's downmajor triad is
 * listed as mid, "~"), but every microtonal chord type works where there
 * are microtonal chords.
 */
export function isChordTypeOffered(type: ChordType, divisions: number) {
  if (offeredIn(divisions).has(type)) return true;
  const info = chordTypeInfo(type);
  return !!info && hasArrows(info.intervals) && hasMicrotonalChords(divisions);
}

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
  // without ups and downs, a mid is major (or perfect): Kite's closest
  // 12-TET chord
  const intervals = isChordTypeOffered(type, divisions)
    ? info.intervals
    : info.intervals.map((ivl) =>
        ivl
          .replace(/[↑↓]/g, "")
          .replace(/(\d+)~$/, (_, n) =>
            [1, 4, 5].includes(((+n - 1) % 7) + 1) ? `${n}P` : `${n}M`,
          ),
      );
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
  neut: "↓",
  neut7: "↓,7",
  "sus2↓": "↓sus2",
  "sus4↑": "↑sus4",
  "maj↑3": "↑",
  "min↓3": "↓m",
  quartal: "7sus4no5",
  // the engine's symbols before Kite's chord names that it reads otherwise
  "sus↓2": "↓sus2",
  "sus↑4": "↑sus4",
  "m(↓maj7)": "m↓M7",
};

/**
 * Maps a chord type saved by an older version to its current symbol: gv's
 * old chord list, and the engine's older symbols ("(↓3)" is now "↓", read by
 * the engine as major with a downed 3rd).
 */
export function migrateChordType(type: string): ChordType {
  const renamed = RENAMED[type] ?? type;
  return chordTypeInfo(renamed)?.type ?? renamed;
}
