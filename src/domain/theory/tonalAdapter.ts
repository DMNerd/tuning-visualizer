// The only module that talks to the microtonal fork of Tonal
// (vendor/microtonal). gv's model is integer pitch classes 0..N-1; this
// adapter converts between those and the fork's spelled names, so the rest
// of the app never handles fork objects or note spellings directly.
// See docs/microtonal-migration-plan.md.

import { mod } from "@shared/lib/math";
import {
  Chord,
  ChordType,
  Interval,
  Note,
  ScaleType,
  edoProfile,
  setEdoSpelling,
} from "@vendor/microtonal/index.mjs";

// Decision D1: EDOs whose fifths don't make a usable diatonic scale are
// sized proportionally, so major and minor chords stay apart (the fork's
// default spells every EDO by fifths)
setEdoSpelling("proportional-fallback");

/**
 * Whether ups and downs are distinct from sharps and flats in an EDO, so
 * microtonal chords and scales exist there (24-, 17-, 22-, 31-EDO…). In
 * 12- and 19-EDO an up is a sharp; in badly-fitting EDOs pitches are mapped
 * proportionally from 12-TET (see the fork's `edoProfile`).
 */
export function supportsMicrotonal(edo: number): boolean {
  if (!Number.isInteger(edo) || edo < 1) return false;
  const profile = edoProfile(edo);
  return profile.spelling === "fifths" && profile.sharp >= 2;
}

/**
 * Signed size of an interval ("3M", "↓3M", "-5P") in steps of an EDO. EDOs
 * whose fifths fit stack fifths; the others scale the 12-TET size.
 */
export function intervalSteps(interval: string, edo: number): number {
  return Interval.edoSteps(interval, edo);
}

export interface DetectedChord {
  rootPc: number;
  bassPc: number;
  /** Chord type symbol, e.g. "m7" or "(↓3)". */
  symbol: string;
  /** Chord type name, e.g. "minor seventh" ("" when the type has none). */
  name: string;
  /** Chord tone intervals by pitch class, e.g. { 0: "1P", 7: "↓3M" }. */
  intervalsByPc: Record<number, string>;
}

/**
 * Chords made of exactly these pitch classes, most likely first. `bassPc`
 * (which must be one of them) is the lowest note: chords rooted elsewhere
 * are inversions.
 */
export function detectChords(
  pcs: readonly number[],
  edo: number,
  bassPc: number,
): DetectedChord[] {
  // The fork takes note names, with the bass first
  const ordered = [bassPc, ...pcs.filter((pc) => pc !== bassPc)];
  const notes = ordered.map((pc) =>
    Note.fromEdoSteps(pc, edo, { pitchClass: true }),
  );

  const found: DetectedChord[] = [];
  for (const detected of Chord.detect(notes, { edo })) {
    const [tonic, symbol] = Chord.tokenize(detected);
    // EDO-built chords (harmonic, subharmonic) are only found with the EDO
    const type = ChordType.get(symbol, { edo });
    const rootPc = Note.edoChroma(tonic, edo);
    if (type.empty || !Number.isFinite(rootPc)) continue;
    const intervalsByPc: Record<number, string> = {};
    for (const interval of type.intervals) {
      intervalsByPc[mod(rootPc + intervalSteps(interval, edo), edo)] = interval;
    }
    found.push({ rootPc, bassPc, symbol, name: type.name, intervalsByPc });
  }
  return found;
}

export type Accidental = "sharp" | "flat";

/** Name of a pitch class in an EDO, e.g. 3 in 24-EDO => "C#↑" or "D↓". */
export function pcToName(
  pc: number,
  edo: number,
  accidental: Accidental = "sharp",
): string {
  return Note.edoNames(edo, accidental)[mod(pc, edo)] ?? "";
}

/**
 * Pitch class of a note name in an EDO, or null when it isn't a note.
 * Accepts any spelling the fork parses: "Db↑", "^C#", "vE", "C##", "E4".
 */
export function nameToPc(name: string, edo: number): number | null {
  const pc = Note.edoChroma(name, edo);
  return Number.isFinite(pc) ? pc : null;
}

/**
 * Every scale the fork has for an EDO, as names and pitch classes above 0:
 * the traditional scales, plus maqamat and other microtonal scales where ups
 * and downs exist, plus temperament scales in their EDOs.
 */
export function scalesForEdo(edo: number): { name: string; pcs: number[] }[] {
  return ScaleType.forEdo(edo).map(({ name, chroma }) => ({
    name,
    pcs: [...chroma].flatMap((bit, pc) => (bit === "1" ? [pc] : [])),
  }));
}

/** Sorted, distinct pitch classes of intervals above pitch class 0. */
export function pcsForIntervals(
  intervals: readonly string[],
  edo: number,
): number[] {
  const pcs = new Set(
    intervals.map((interval) => mod(intervalSteps(interval, edo), edo)),
  );
  return [...pcs].sort((a, b) => a - b);
}
