// Generic N-TET utilities + 24-TET names

export type TuningSystem = {
  id: string;           // e.g. "12-TET", "24-TET"
  divisions: number;    // N: divisions per octave
  refFreq: number;      // A4 reference
  refMidi: number;      // A4 midi (69)
  nameForPc: (pc: number) => string; // name for pitch-class [0..N-1]
};

export const nameFallback = (pc: number) => `N${pc}`;

/** 24-TET pitch-class names (C=0) with quarter-tone arrows.
 *  ASCII fallback in parentheses if you prefer: ↑ => (+), ↓ => (-)
 */
const N24_NAMES = [
  "C", "C↑", "C#", "C#↑",
  "D", "D↑", "D#", "D#↑",
  "E", "E↑", "F",  "F↑",
  "F#", "F#↑", "G", "G↑",
  "G#", "G#↑", "A", "A↑",
  "A#", "A#↑", "B", "B↑",
];

export const TUNINGS: Record<string, TuningSystem> = {
  "12-TET": {
    id: "12-TET",
    divisions: 12,
    refFreq: 440,
    refMidi: 69,
    nameForPc: (pc) => {
      const SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
      return SHARP[((pc % 12) + 12) % 12];
    },
  },
  "24-TET": {
    id: "24-TET",
    divisions: 24,
    refFreq: 440,
    refMidi: 69,
    nameForPc: (pc) => N24_NAMES[((pc % 24) + 24) % 24] ?? nameFallback(pc),
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
export function centsFromNearest(f: number, sys: TuningSystem): { cents: number; nearestStep: number } {
  const raw = sys.divisions * Math.log2(f / sys.refFreq);
  const nearest = Math.round(raw);
  const deltaSteps = raw - nearest;
  const cents = deltaSteps * (1200 / 1); // 1200 cents per octave; 1 step = 1200/N of an octave; the factor is baked into raw
  return { cents, nearestStep: nearest };
}
