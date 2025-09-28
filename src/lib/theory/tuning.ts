// Generic N-TET utilities + 24-TET names

type Accidental = "sharp" | "flat";

type TuningSystem = {
  id: string; // e.g. "12-TET", "24-TET"
  divisions: number; // N: divisions per octave
  refFreq: number; // A4 reference
  refMidi: number; // A4 midi (69)
  nameForPc: (pc: number, accidental?: Accidental) => string; // name for pitch-class [0..N-1]
};

export const nameFallback = (pc: number) => `N${pc}`;

/** 24-TET pitch-class names (C=0)
 *  We provide both "sharp-oriented" (↑ and #) and "flat-oriented" (↓ and b) views.
 *  Indices:
 *    0:C  1:quarter↑  2:semitone  3:3/4↑  4:D  5:D↑  6:D#  7:D#↑  8:E  9:E↑
 *   10:F 11:F↑        12:F#       13:F#↑ 14:G 15:G↑  16:G# 17:G#↑ 18:A 19:A↑
 *   20:A# 21:A#↑      22:B        23:B↑
 */

// Sharp-oriented (default)
const N24_NAMES_SHARP = [
  "C",
  "C↑",
  "C#",
  "C#↑",
  "D",
  "D↑",
  "D#",
  "D#↑",
  "E",
  "E↑",
  "F",
  "F↑",
  "F#",
  "F#↑",
  "G",
  "G↑",
  "G#",
  "G#↑",
  "A",
  "A↑",
  "A#",
  "A#↑",
  "B",
  "B↑",
];

// Flat-oriented
// Choose flats where enharmonic with a sharp degree; quarter-tones use ↓ relative to the next flat.
const N24_NAMES_FLAT = [
  "C",
  "Db↓",
  "Db",
  "Db↑",
  "D",
  "Eb↓",
  "Eb",
  "Eb↑",
  "E",
  "F↓",
  "F",
  "Gb↓",
  "Gb",
  "G↓",
  "G",
  "Ab↓",
  "Ab",
  "A↓",
  "A",
  "Bb↓",
  "Bb",
  "B↓",
  "B",
  "C↓",
];

export const TUNINGS: Record<string, TuningSystem> = {
  "12-TET": {
    id: "12-TET",
    divisions: 12,
    refFreq: 440,
    refMidi: 69,
    nameForPc: (pc, accidental = "sharp") => {
      const SHARP = [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
      ];
      const FLAT = [
        "C",
        "Db",
        "D",
        "Eb",
        "E",
        "F",
        "Gb",
        "G",
        "Ab",
        "A",
        "Bb",
        "B",
      ];
      const idx = ((pc % 12) + 12) % 12;
      return (accidental === "flat" ? FLAT : SHARP)[idx];
    },
  },
  "24-TET": {
    id: "24-TET",
    divisions: 24,
    refFreq: 440,
    refMidi: 69,
    nameForPc: (pc, accidental = "sharp") => {
      const idx = ((pc % 24) + 24) % 24;
      const arr = accidental === "flat" ? N24_NAMES_FLAT : N24_NAMES_SHARP;
      return arr[idx] ?? nameFallback(pc);
    },
  },
};

/** Convert frequency to nearest N-TET step offset from reference (A4), as an integer. */
export function freqToStep(f: number, sys: TuningSystem): number {
  return Math.round(sys.divisions * Math.log2(f / sys.refFreq));
}

/** Convert step offset (relative to A4) to frequency. step=0 => A4. */
export function stepToFreq(step: number, sys: TuningSystem): number {
  return sys.refFreq * Math.pow(2, step / sys.divisions);
}

/** MIDI <-> step helpers (keeps your existing MIDI logic usable) */
export function midiToStep(midi: number, sys: TuningSystem): number {
  // 12-TET midi to step, generalized: 12 steps per semitone -> N/12 of those
  return Math.round((midi - sys.refMidi) * (sys.divisions / 12));
}

export function stepToMidi(step: number, sys: TuningSystem): number {
  return Math.round(step * (12 / sys.divisions) + sys.refMidi);
}

/** Pitch-class (0..N-1) from a global step count. */
export function stepToPc(step: number, sys: TuningSystem): number {
  return ((step % sys.divisions) + sys.divisions) % sys.divisions;
}

/** Cents deviation of a frequency from the nearest N-TET step (for your tuner needle). */
export function centsFromNearest(
  f: number,
  sys: TuningSystem,
): { cents: number; nearestStep: number } {
  const raw = sys.divisions * Math.log2(f / sys.refFreq);
  const nearest = Math.round(raw);
  const deltaSteps = raw - nearest;
  const cents = deltaSteps * 1200; // 1200 cents per octave
  return { cents, nearestStep: nearest };
}
