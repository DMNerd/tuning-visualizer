export type SystemId = `${number}-TET`;

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
  return Math.max(FRETS_MIN, Math.min(FRETS_MAX, scaled));
}

/* =========================
   App-wide defaults
========================= */

export const SYSTEM_DEFAULT: SystemId = "12-TET";
export const ROOT_DEFAULT = "C";
export const CAPO_DEFAULT = 0;

export const DISPLAY_DEFAULTS = {
  show: "names" as "names" | "degrees" | "intervals" | "fret" | "off",
  showOpen: true,
  showFretNums: true,
  dotSize: 14,
  lefty: false,
  openOnlyInScale: false,
  colorByDegree: false,
  accidental: "sharp" as "sharp" | "flat",
  microLabelStyle: "letters" as "letters" | "unicode" | "none",
};
