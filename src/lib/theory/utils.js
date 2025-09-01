import { NOTES_SHARP, NOTES_FLAT, DEGREE_NAMES } from "./constants";

export const mod = (n, m) => ((n % m) + m) % m;
export const noteIndex = (name) =>
  Math.max(NOTES_SHARP.indexOf(name), NOTES_FLAT.indexOf(name));

export const namesFor = (accidental) =>
  accidental === "flat" ? NOTES_FLAT : NOTES_SHARP;

export function degreeFor(noteIx, rootIx, intervals) {
  const semis = mod(noteIx - rootIx, 12);
  const diatonicOrder = intervals.indexOf(semis);
  if (diatonicOrder >= 0)
    return diatonicOrder === 0
      ? "1"
      : (["2", "3", "4", "#4", "5", "6", "7"][diatonicOrder] ?? "•");
  return DEGREE_NAMES[semis];
}
