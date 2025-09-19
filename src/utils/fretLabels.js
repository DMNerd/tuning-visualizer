// src/utils/fretLabels.js

/**
 * Micro-fret label styles:
 *  - Letters:      0a, 0aa, 1a … (repeating "a" for micro-steps)
 *  - Accidentals:  0s / 1b (and multiples like 0ss, 1bb) — only for 12×k systems
 *  - Fractions:    0+rem/N (always available, exact)
 */
export const MICRO_LABEL_STYLES = {
  Letters: "letters",
  Accidentals: "accidental",
  Fractions: "fraction",
};

/**
 * Build a human-friendly label for a fret index `f` on an N-division temperament.
 *
 * @param {number} f - Fret index (0-based) in the current N-TET grid.
 * @param {number} divisions - N of N-TET (e.g., 12, 24, 19, 31, 36…).
 * @param {Object} [options]
 * @param {'letters'|'accidental'|'fraction'} [options.microStyle='letters']
 * @param {'sharp'|'flat'} [options.accidental] - Only used when microStyle='accidental'.
 *
 * Behavior:
 *  • Exact 12-TET hits (integer semitone) → plain integer "0, 1, 2…".
 *  • Letters:
 *      - For N = 12×k → `${semi}${"a".repeat(sub)}` where sub=1..(k-1)
 *      - For N ≠ 12×k (NTET) → rounded cumulative per-semitone boundaries,
 *        and use repeated "a" for the micro index inside that semitone.
 *  • Accidentals (only meaningful for 12×k):
 *      - Sharps: `${semi}${"s".repeat(sub)}`
 *      - Flats:  `${semi+1}${"b".repeat(perSemi - sub)}`
 *      - For NTET it falls back to Fractions.
 *  • Fractions: `${semi}+${rem}/${divisions}` always works and is exact.
 */
export function buildFretLabel(
  f,
  divisions,
  options = { microStyle: MICRO_LABEL_STYLES.Letters, accidental: undefined },
) {
  const microStyle = options?.microStyle ?? MICRO_LABEL_STYLES.Letters;
  const accidental = options?.accidental;

  // Map f into the 12-TET frame to know which 12-semitone band we're in.
  // scaled = f * 12; semi = floor(scaled / N); rem = scaled % N
  const scaled = f * 12;
  const rem = scaled % divisions;
  const semi = Math.floor(scaled / divisions);

  // Exact 12-TET semitone hit → integer label.
  if (rem === 0) return String(semi);

  // Fractions mode: always available, exact, short-circuits others.
  if (microStyle === MICRO_LABEL_STYLES.Fractions) {
    return `${semi}+${rem}/${divisions}`;
  }

  const isMultipleOf12 = divisions % 12 === 0;

  if (isMultipleOf12) {
    // We are between two 12-TET semitones; there are perSemi microsteps
    // inside the current semitone. The local index `sub` is 1..perSemi-1.
    const perSemi = divisions / 12;
    const sub = f % perSemi; // local micro index within the semitone

    if (
      microStyle === MICRO_LABEL_STYLES.Accidentals &&
      (accidental === "sharp" || accidental === "flat")
    ) {
      // Sharps: count up from lower integer (semi) → 0s, 0ss, …
      // Flats:  count down from the upper integer (semi+1) → 1bbb … 1b
      if (accidental === "sharp") {
        return `${semi}${"s".repeat(sub)}`;
      } else {
        const stepsDown = perSemi - sub;
        return `${semi + 1}${"b".repeat(stepsDown)}`;
      }
    }

    // Letters style for 12×k: repeat "a" for the micro index.
    return `${semi}${"a".repeat(sub)}`;
  }

  // NTET path (divisions not a multiple of 12)
  if (microStyle === MICRO_LABEL_STYLES.Accidentals) {
    // Accidentals aren't well-defined off the 12×k grid → show exact fraction.
    return `${semi}+${rem}/${divisions}`;
  }

  // Letters for NTET:
  // Use rounded cumulative boundaries to decide how many frets lie within each 12-TET semitone.
  // For a given 12-TET semitone 'semi', the start and end N-TET indices are:
  //   start = round(semi   * N / 12)
  //   end   = round((semi+1)* N / 12)
  // Then sub = f - start is the local index inside that semitone.
  const start = Math.round((semi * divisions) / 12);
  const end = Math.round(((semi + 1) * divisions) / 12);
  const sub = f - start; // 0..(end - start - 1)

  // If (sub <= 0), we're effectively on or before the integer boundary,
  // but we already handled exact integers above; still, guard defensively.
  if (sub <= 0) return String(semi);

  return `${semi}${"a".repeat(sub)}`;
}

/**
 * (Optional) Convenience: build a small window of labels for preview/testing.
 * Not used by the app runtime; handy in unit tests or storybooks.
 *
 * @param {number} startFret
 * @param {number} count
 * @param {number} divisions
 * @param {Object} options - same as buildFretLabel
 * @returns {string[]} labels
 */
export function sampleLabels(startFret, count, divisions, options) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(buildFretLabel(startFret + i, divisions, options));
  }
  return out;
}
