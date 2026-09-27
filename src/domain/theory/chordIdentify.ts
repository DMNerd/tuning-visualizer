import { mod } from "@shared/lib/math";
import {
  buildChordPCsFromPc,
  isMicrotonalChordType,
  type ChordType,
} from "@domain/theory/chords";

/**
 * Chord dictionary used for naming a user-picked pitch-class set.
 *
 * Entries tied to an app chord type (`appType`) take their steps from the
 * chord library in chords.ts, so a match can be loaded straight back into the
 * chord controls and overlays exactly the same notes. The remaining entries
 * are 12-TET formulas projected into other EDOs.
 *
 * Order matters: it is the tie-breaker between equally good matches, so
 * simpler/more common spellings come first.
 */
interface ChordEntry {
  id: string;
  /** Appended to the root name, e.g. "m7" → "Am7". */
  suffix: string;
  /** Human-readable quality, e.g. "minor seventh". */
  name: string;
  appType?: ChordType;
  /** 12-TET semitones; only used for entries without an appType. */
  semitones?: number[];
}

const DICTIONARY: readonly ChordEntry[] = [
  { id: "maj", suffix: "", name: "major", appType: "maj" },
  { id: "min", suffix: "m", name: "minor", appType: "min" },
  { id: "dim", suffix: "dim", name: "diminished", appType: "dim" },
  { id: "aug", suffix: "aug", name: "augmented", appType: "aug" },
  { id: "sus2", suffix: "sus2", name: "suspended 2nd", appType: "sus2" },
  { id: "sus4", suffix: "sus4", name: "suspended 4th", appType: "sus4" },
  { id: "5", suffix: "5", name: "power chord", semitones: [0, 7] },
  { id: "neut", suffix: "n", name: "neutral", appType: "neut" },
  { id: "maj↑3", suffix: "(↑3)", name: "major, raised 3rd", appType: "maj↑3" },
  {
    id: "min↓3",
    suffix: "m(↓3)",
    name: "minor, lowered 3rd",
    appType: "min↓3",
  },
  {
    id: "sus2↓",
    suffix: "sus2↓",
    name: "suspended lowered 2nd",
    appType: "sus2↓",
  },
  {
    id: "sus4↑",
    suffix: "sus4↑",
    name: "suspended raised 4th",
    appType: "sus4↑",
  },
  { id: "7", suffix: "7", name: "dominant seventh", appType: "7" },
  { id: "maj7", suffix: "maj7", name: "major seventh", appType: "maj7" },
  { id: "m7", suffix: "m7", name: "minor seventh", appType: "m7" },
  { id: "m7b5", suffix: "m7♭5", name: "half-diminished", appType: "m7b5" },
  { id: "dim7", suffix: "dim7", name: "diminished seventh", appType: "dim7" },
  { id: "6", suffix: "6", name: "major sixth", appType: "6" },
  { id: "m6", suffix: "m6", name: "minor sixth", appType: "m6" },
  { id: "neut7", suffix: "n7", name: "neutral seventh", appType: "neut7" },
  {
    id: "mMaj7",
    suffix: "m(maj7)",
    name: "minor-major seventh",
    semitones: [0, 3, 7, 11],
  },
  {
    id: "7sus4",
    suffix: "7sus4",
    name: "dominant seventh sus4",
    semitones: [0, 5, 7, 10],
  },
  {
    id: "7#5",
    suffix: "7♯5",
    name: "augmented seventh",
    semitones: [0, 4, 8, 10],
  },
  {
    id: "maj7#5",
    suffix: "maj7♯5",
    name: "augmented major seventh",
    semitones: [0, 4, 8, 11],
  },
  {
    id: "7b5",
    suffix: "7♭5",
    name: "dominant seventh flat 5",
    semitones: [0, 4, 6, 10],
  },
  { id: "add9", suffix: "add9", name: "added ninth", appType: "add9" },
  {
    id: "madd9",
    suffix: "m(add9)",
    name: "minor added ninth",
    semitones: [0, 2, 3, 7],
  },
  {
    id: "add11",
    suffix: "add11",
    name: "added eleventh",
    semitones: [0, 4, 5, 7],
  },
  { id: "9", suffix: "9", name: "dominant ninth", semitones: [0, 2, 4, 7, 10] },
  {
    id: "maj9",
    suffix: "maj9",
    name: "major ninth",
    semitones: [0, 2, 4, 7, 11],
  },
  { id: "m9", suffix: "m9", name: "minor ninth", semitones: [0, 2, 3, 7, 10] },
  { id: "6/9", suffix: "6/9", name: "six-nine", semitones: [0, 2, 4, 7, 9] },
  {
    id: "7b9",
    suffix: "7♭9",
    name: "dominant seventh flat 9",
    semitones: [0, 1, 4, 7, 10],
  },
  {
    id: "7#9",
    suffix: "7♯9",
    name: "dominant seventh sharp 9",
    semitones: [0, 3, 4, 7, 10],
  },
  {
    id: "7#11",
    suffix: "7♯11",
    name: "dominant seventh sharp 11",
    semitones: [0, 4, 6, 7, 10],
  },
  {
    id: "maj7#11",
    suffix: "maj7♯11",
    name: "major seventh sharp 11",
    semitones: [0, 4, 6, 7, 11],
  },
  {
    id: "11",
    suffix: "11",
    name: "dominant eleventh",
    semitones: [0, 2, 4, 5, 7, 10],
  },
  {
    id: "m11",
    suffix: "m11",
    name: "minor eleventh",
    semitones: [0, 2, 3, 5, 7, 10],
  },
  {
    id: "13",
    suffix: "13",
    name: "dominant thirteenth",
    semitones: [0, 2, 4, 7, 9, 10],
  },
  {
    id: "quartal",
    suffix: " quartal",
    name: "stacked fourths",
    appType: "quartal",
  },
];

export interface ChordMatch {
  rootPc: number;
  /** Lowest note; differs from rootPc for inversions (slash chords). */
  bassPc: number;
  id: string;
  suffix: string;
  name: string;
  /** Set when the match can be loaded into the chord controls. */
  appType: ChordType | null;
  /** True when the formula's 5th is missing from the picked notes. */
  omitsFifth: boolean;
}

interface ResolvedEntry extends ChordEntry {
  steps: Set<number>;
}

function stepsForEntry(entry: ChordEntry, divisions: number): Set<number> {
  if (entry.appType) return buildChordPCsFromPc(0, entry.appType, divisions);
  const factor = divisions / 12;
  return new Set(
    (entry.semitones ?? []).map((s) => mod(Math.round(s * factor), divisions)),
  );
}

const resolvedCache = new Map<number, ResolvedEntry[]>();

/**
 * Dictionary for one EDO. Microtonal app types only have distinct formulas in
 * 24-EDO (elsewhere they fall back to duplicates of standard chords), and in
 * coarse EDOs projection can merge tones or make two entries identical, so
 * those are dropped too.
 */
function resolveDictionary(divisions: number): ResolvedEntry[] {
  const cached = resolvedCache.get(divisions);
  if (cached) return cached;

  const seen = new Set<string>();
  const out: ResolvedEntry[] = [];
  for (const entry of DICTIONARY) {
    if (
      entry.appType &&
      isMicrotonalChordType(entry.appType) &&
      divisions !== 24
    )
      continue;
    const steps = stepsForEntry(entry, divisions);
    const expectedSize = stepsForEntry(entry, 12).size;
    if (steps.size < 2 || steps.size !== expectedSize) continue;
    const signature = [...steps].sort((a, b) => a - b).join(",");
    if (seen.has(signature)) continue;
    seen.add(signature);
    out.push({ ...entry, steps });
  }
  resolvedCache.set(divisions, out);
  return out;
}

function sameSet(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) if (!b.has(value)) return false;
  return true;
}

/**
 * Names a set of picked pitch classes. Every picked note is tried as the root;
 * a candidate matches when the intervals above it equal a dictionary formula,
 * or equal it minus the perfect 5th (a common omission in real voicings).
 *
 * `bassPc` (defaults to the first pick) marks the lowest note: interpretations
 * rooted on it rank first, the rest are reported as slash chords.
 *
 * Results are ranked: complete formulas before no-5th ones, root-position
 * before inversions, then by dictionary order (simpler names first).
 */
export function identifyChord(
  pitchClasses: Iterable<number>,
  divisions: number,
  bassPc?: number | null,
): ChordMatch[] {
  if (!Number.isInteger(divisions) || divisions < 1) return [];

  const ordered: number[] = [];
  for (const raw of pitchClasses) {
    if (!Number.isFinite(raw)) continue;
    const pc = mod(Math.round(raw), divisions);
    if (!ordered.includes(pc)) ordered.push(pc);
  }
  if (ordered.length < 2) return [];

  const bass =
    bassPc != null && ordered.includes(mod(bassPc, divisions))
      ? mod(bassPc, divisions)
      : ordered[0];
  const fifth = mod(Math.round((7 * divisions) / 12), divisions);
  const dictionary = resolveDictionary(divisions);

  const ranked: { match: ChordMatch; rank: number[] }[] = [];
  for (const rootPc of ordered) {
    const intervals = new Set(ordered.map((pc) => mod(pc - rootPc, divisions)));
    const withFifth = new Set(intervals).add(fifth);
    // A no-5th reading only adds noise when the same root already has an
    // exact name (e.g. C F B♭ is "C quartal", not also "C7sus4(no5)").
    const hasExact = dictionary.some((entry) =>
      sameSet(intervals, entry.steps),
    );
    const allowOmitFifth =
      !hasExact && ordered.length >= 3 && !intervals.has(fifth);

    dictionary.forEach((entry, order) => {
      const exact = sameSet(intervals, entry.steps);
      const omitsFifth =
        !exact && allowOmitFifth && sameSet(withFifth, entry.steps);
      if (!exact && !omitsFifth) return;

      ranked.push({
        match: {
          rootPc,
          bassPc: bass,
          id: entry.id,
          suffix: entry.suffix,
          name: entry.name,
          appType: entry.appType ?? null,
          omitsFifth,
        },
        rank: [omitsFifth ? 1 : 0, rootPc === bass ? 0 : 1, order],
      });
    });
  }

  ranked.sort((a, b) => {
    for (let i = 0; i < a.rank.length; i += 1) {
      if (a.rank[i] !== b.rank[i]) return a.rank[i] - b.rank[i];
    }
    return 0;
  });
  return ranked.map(({ match }) => match);
}

type NameForPc = (pc: number) => string;

/** Compact symbol, e.g. "Cmaj7", "C7(no5)", "Am7/C". */
export function formatChordSymbol(match: ChordMatch, nameForPc: NameForPc) {
  const omit = match.omitsFifth ? "(no5)" : "";
  const slash =
    match.bassPc !== match.rootPc ? `/${nameForPc(match.bassPc)}` : "";
  return `${nameForPc(match.rootPc)}${match.suffix}${omit}${slash}`;
}

/** Long form, e.g. "A minor seventh, over C". */
export function formatChordName(match: ChordMatch, nameForPc: NameForPc) {
  const omit = match.omitsFifth ? " (no 5th)" : "";
  const slash =
    match.bassPc !== match.rootPc ? `, over ${nameForPc(match.bassPc)}` : "";
  return `${nameForPc(match.rootPc)} ${match.name}${omit}${slash}`;
}
