import { mod } from "@shared/lib/math";
import { isChordTypeOffered } from "@domain/theory/chords";
import type { ChordType as AppChordType } from "@domain/theory/chords";
import { detectChords } from "@domain/theory/tonalAdapter";

/**
 * Chord naming for a user-picked pitch-class set, backed by the microtonal
 * fork of Tonal (@dmnerd/microtonal). Tonal detects chords in any EDO, and in
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
  // Already ranked by the fork: common chords first, root position before
  // inversions of the same kind of chord.
  return detectChords(ordered, divisions, bass).map((chord) => {
    return {
      rootPc: chord.rootPc,
      bassPc: chord.bassPc,
      id: chord.symbol,
      // Tonal's major symbol is "M"; a bare root reads better
      suffix: chord.symbol === "M" ? "" : chord.symbol,
      name: chord.name || chord.symbol,
      // the chord controls offer the same chord types
      appType: isChordTypeOffered(chord.symbol, divisions)
        ? chord.symbol
        : null,
      degrees: chord.intervalsByPc,
    };
  });
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
