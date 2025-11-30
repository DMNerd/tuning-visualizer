import { clamp } from "@/utils/math";

/* =========================
   Instrument bounds & factories
========================= */

export const STR_MIN = 4;
export const STR_MAX = 8;

export const FRETS_MIN = 12;
export const FRETS_MAX = 30;

export const STR_FACTORY = 6;
export const FRETS_FACTORY = 24;

export function getFactoryFrets(edo: number): number {
  if (!Number.isFinite(edo) || edo <= 0) return FRETS_FACTORY;
  if (edo === 12) return FRETS_FACTORY;
  if (edo === 24) return FRETS_MIN;
  const scaled = Math.round((FRETS_FACTORY * 12) / edo);
  return clamp(scaled, FRETS_MIN, FRETS_MAX);
}

/* =========================
   App-wide defaults
========================= */
export type SystemId = `${number}-TET`;
export const SCALE_DEFAULT = "Major (Ionian)";
export const CHORD_DEFAULT = "maj";
export const SYSTEM_DEFAULT: SystemId = "12-TET";
export const ROOT_DEFAULT = "C";
export const CAPO_DEFAULT = 0;

export const DOT_SIZE_MIN = 8;
export const DOT_SIZE_MAX = 24;
export const DOT_SIZE_DEFAULT = 14;

export const DISPLAY_DEFAULTS = {
  show: "names" as
    | "names"
    | "degrees"
    | "intervals"
    | "edoSteps"
    | "fret"
    | "off",
  showOpen: true,
  showFretNums: true,
  dotSize: 14,
  lefty: false,
  openOnlyInScale: false,
  colorByDegree: false,
  accidental: "sharp" as "sharp" | "flat",
  microLabelStyle: "letters" as "letters" | "unicode" | "none",
};
