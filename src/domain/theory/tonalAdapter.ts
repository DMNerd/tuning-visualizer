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
  Scale,
  ScaleType,
  setEdoSpelling,
} from "@vendor/microtonal/index.mjs";

// Decision D1: EDOs whose fifths don't make a usable diatonic scale are
// sized proportionally, so major and minor chords stay apart (the fork's
// default spells every EDO by fifths)
setEdoSpelling("proportional-fallback");

/**
 * Signed size of an interval ("3M", "↓3M", "-5P") in steps of an EDO. EDOs
 * whose fifths fit stack fifths; the others scale the 12-TET size.
 */
export function intervalSteps(interval: string, edo: number): number {
  return Interval.edoSteps(interval, edo);
}

/**
 * Label of an interval of `steps` steps above a root, quality first as gv
 * shows it: 7 in 24-EDO => "↑m3", 16 in 22-EDO => "↓M6". 12-TET's tritone
 * keeps its usual "TT".
 */
export function intervalLabel(steps: number, edo: number): string {
  if (edo === 12 && mod(steps, 12) === 6) return "TT";
  const name = Interval.fromEdoSteps(steps, edo);
  const m = /^(-?)([↑↓]*)(\d+)(.+)$/.exec(name);
  return m ? `${m[1]}${m[2]}${m[4]}${m[3]}` : name;
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

export interface ChordTypeInfo {
  /** The chord symbol, e.g. "M", "m7", "(↓3)" */
  type: string;
  /** Full name, e.g. "major seventh" ("" for Tonal's unnamed chords). */
  name: string;
  intervals: string[];
  /** How common the chord is: 0 core, 1 other named, 2 unnamed. */
  tier: number;
}

const chordTypeInfoOf = (t: ReturnType<typeof ChordType.get>) => ({
  type: t.aliases[0],
  name: t.name,
  intervals: t.intervals,
  tier: ChordType.tier(t),
});

/**
 * Every chord type the fork has for an EDO: the traditional chords, plus
 * microtonal chords where ups and downs exist, plus chords built for the EDO
 * from ratios (harmonic and subharmonic chords).
 */
export function chordTypesForEdo(edo: number): ChordTypeInfo[] {
  return ChordType.forEdo(edo).map(chordTypeInfoOf);
}

/**
 * A chord type by symbol or name. Chords built from ratios are only found
 * with the EDO.
 */
export function chordTypeInfo(
  type: string,
  edo?: number,
): ChordTypeInfo | null {
  const found = ChordType.get(type, edo === undefined ? undefined : { edo });
  return found.empty ? null : chordTypeInfoOf(found);
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

const pcName = (pc: number, edo: number) =>
  Note.fromEdoSteps(pc, edo, { pitchClass: true });

/**
 * Scales of an EDO that contain these pitch classes, with `tonicPc` as their
 * tonic: the exact match first, then larger scales.
 */
export function detectScales(
  pcs: readonly number[],
  edo: number,
  tonicPc: number,
): { name: string; exact: boolean }[] {
  const notes = pcs.map((pc) => pcName(pc, edo));
  const options = { edo, tonic: pcName(tonicPc, edo) };
  const exact = Scale.detect(notes, { ...options, match: "exact" });
  return Scale.detect(notes, { ...options, match: "fit" }).map((found) => ({
    name: Scale.tokenize(found)[1],
    exact: exact.includes(found),
  }));
}

/** The named modes of a scale: the steps above its root each one starts on. */
export function scaleModes(
  name: string,
  edo: number,
): { steps: number; name: string }[] {
  return Scale.modeNames(name, { edo }).map(([interval, mode]) => ({
    steps: mod(intervalSteps(interval, edo), edo),
    name: mode,
  }));
}

/** Frequency of the pitch `steps` steps of the EDO above C0 (A4 = refFreq). */
export function stepsFrequency(
  steps: number,
  edo: number,
  refFreq = 440,
): number | null {
  return Note.edoFreq(Note.fromEdoSteps(steps, edo), edo, { refFreq });
}
