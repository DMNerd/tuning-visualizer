import { mod } from "@shared/lib/math";
import { CHORD_TYPES, buildChordPCsFromPc } from "@domain/theory/chords";
import type { ChordType as AppChordType } from "@domain/theory/chords";
import { Chord, ChordType, Interval, Note } from "@vendor/microtonal/index.mjs";

/**
 * Chord naming for a user-picked pitch-class set, backed by the microtonal
 * fork of Tonal (vendor/microtonal). Tonal detects chords in any EDO, and in
 * EDOs where ups and downs are finer than a sharp (24-EDO and others) it also
 * knows microtonal chords such as the neutral triad, "C(↓3)".
 */
export interface ChordMatch {
  rootPc: number;
  /** Lowest note; differs from rootPc for inversions (slash chords). */
  bassPc: number;
  /** Tonal chord type symbol, e.g. "m7" or "(↓3)". */
  id: string;
  /** Appended to the root name, e.g. "m7" → "Am7" ("" for major). */
  suffix: string;
  /** Human-readable quality, e.g. "minor seventh". */
  name: string;
  /** Set when the match can be loaded into the chord controls. */
  appType: AppChordType | null;
  /** Interval of each chord tone above the root, by pitch class ("↓3M"). */
  degrees: Record<number, string>;
}

const signature = (steps: Iterable<number>) =>
  [...steps].sort((a, b) => a - b).join(",");

const appTypeCache = new Map<number, Map<string, AppChordType>>();

/**
 * App chord types by their step set above the root, for one EDO. When two
 * types share a set (microtonal types fall back to standard formulas outside
 * 24-EDO) the first one in the library wins.
 */
function appTypesFor(divisions: number): Map<string, AppChordType> {
  const cached = appTypeCache.get(divisions);
  if (cached) return cached;
  const byStepSet = new Map<string, AppChordType>();
  for (const type of CHORD_TYPES) {
    const key = signature(buildChordPCsFromPc(0, type, divisions));
    if (!byStepSet.has(key)) byStepSet.set(key, type);
  }
  appTypeCache.set(divisions, byStepSet);
  return byStepSet;
}

/**
 * Names a set of picked pitch classes. `bassPc` (defaults to the first pick)
 * marks the lowest note: interpretations rooted on it come first, the rest
 * are reported as slash chords.
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
  // Tonal treats the first note as the bass.
  const notes = [bass, ...ordered.filter((pc) => pc !== bass)].map((pc) =>
    Note.fromEdoSteps(pc, divisions, { pitchClass: true }),
  );

  const appTypes = appTypesFor(divisions);
  const matches: ChordMatch[] = [];
  for (const symbol of Chord.detect(notes, { edo: divisions })) {
    const [tonic, type] = Chord.tokenize(symbol);
    const chordType = ChordType.get(type);
    const rootPc = Note.edoChroma(tonic, divisions);
    if (chordType.empty || !Number.isFinite(rootPc)) continue;
    const steps = ordered.map((pc) => mod(pc - rootPc, divisions));
    const degrees: Record<number, string> = {};
    for (const ivl of chordType.intervals) {
      degrees[mod(rootPc + Interval.edoSteps(ivl, divisions), divisions)] = ivl;
    }
    matches.push({
      rootPc,
      bassPc: bass,
      id: type,
      // Tonal's major symbol is "M"; a bare root reads better
      suffix: type === "M" ? "" : type,
      name: chordType.name || type,
      appType: appTypes.get(signature(steps)) ?? null,
      degrees,
    });
  }
  // Already ranked by Tonal: common chords first, root position before
  // inversions of the same kind of chord.
  return matches;
}

type NameForPc = (pc: number) => string;

/** Compact symbol, e.g. "Cmaj7", "C(↓3)", "Am7/C". */
export function formatChordSymbol(match: ChordMatch, nameForPc: NameForPc) {
  const slash =
    match.bassPc !== match.rootPc ? `/${nameForPc(match.bassPc)}` : "";
  return `${nameForPc(match.rootPc)}${match.suffix}${slash}`;
}

/** Long form, e.g. "A minor seventh, over C". */
export function formatChordName(match: ChordMatch, nameForPc: NameForPc) {
  const slash =
    match.bassPc !== match.rootPc ? `, over ${nameForPc(match.bassPc)}` : "";
  return `${nameForPc(match.rootPc)} ${match.name}${slash}`;
}
