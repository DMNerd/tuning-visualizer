// src/utils/fretLabels.js

export const MICRO_LABEL_STYLES = {
  Letters: "letters",
  Accidentals: "accidentals",
  Fractions: "fractions",
};

const FRAC_SLASH = "⁄"; // Unicode fraction slash (⁄)

// Common Unicode vulgar fractions for compact display
const VULGAR = {
  "1/2": "½",
  "1/3": "⅓",
  "2/3": "⅔",
  "1/4": "¼",
  "3/4": "¾",
  "1/5": "⅕",
  "2/5": "⅖",
  "3/5": "⅗",
  "4/5": "⅘",
  "1/6": "⅙",
  "5/6": "⅚",
  "1/8": "⅛",
  "3/8": "⅜",
  "5/8": "⅝",
  "7/8": "⅞",
  "1/10": "⅒",
};

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function simplify(n, d) {
  if (n === 0) return [0, 1];
  const g = gcd(n, d);
  return [Math.floor(n / g), Math.floor(d / g)];
}

function formatFractionLabel(baseSemi, num, den) {
  if (num === 0) return String(baseSemi);
  if (num === den) return String(baseSemi + 1);

  // reduce and try to use a single glyph if available
  const [n, d] = simplify(num, den);
  const key = `${n}/${d}`;
  const glyph = VULGAR[key];
  if (glyph) return `${baseSemi}${glyph}`; // e.g., 6½

  // fallback: compact ascii using Unicode fraction slash (no extra spaces)
  return `${baseSemi}+${n}${FRAC_SLASH}${d}`; // e.g., 6+5⁄12
}

function perSemitoneInfo(fret, divisions) {
  // position expressed in 12-TET semitone units
  const pos12 = (fret * 12) / divisions;
  const baseSemi = Math.floor(pos12);
  const micro = pos12 - baseSemi; // 0..1
  const num = Math.round(micro * divisions); // numerator relative to divisions
  const den = divisions; // denominator stays as system divisions
  return { baseSemi, num, den };
}

function labelLetters(fret, divisions) {
  // If divisions is a multiple of 12 → k micro-steps per 12-TET semitone
  if (divisions % 12 === 0) {
    const k = divisions / 12;
    const baseSemi = Math.floor(fret / k);
    const sub = fret % k; // 0..k-1
    if (sub === 0) return String(baseSemi);
    return `${baseSemi}${"a".repeat(sub)}`; // a, aa, aaa...
  }

  // Non-12-multiple: bucket by *rounded boundaries* round(n*div/12)
  // This matches UI tick placement and makes boundary frets integers.
  const boundaries = new Array(13)
    .fill(0)
    .map((_, n) => Math.round((n * divisions) / 12));
  // Find semitone n such that B[n] <= fret < B[n+1]
  let n = 0;
  while (n < 12 && !(boundaries[n] <= fret && fret < boundaries[n + 1])) n++;

  // Exact boundary → integer label
  if (fret === boundaries[n]) return String(n);
  // Inside the bucket → single micro mark from lower integer
  return `${n}a`;
}

function labelAccidentals(fret, divisions, accidental = "sharp") {
  // Only well-defined when divisions is a multiple of 12.
  if (divisions % 12 === 0) {
    const k = divisions / 12;
    const baseSemi = Math.floor(fret / k);
    const sub = fret % k;
    if (sub === 0) return String(baseSemi);
    if (accidental === "flat") {
      // count down from the upper integer: 1b, 1bb, etc.
      return `${baseSemi + 1}${"b".repeat(k - sub)}`;
    }
    // sharps from the lower integer: 0s, 0ss, etc.
    return `${baseSemi}${"s".repeat(sub)}`;
  }

  // Fallback to fractional formatting for NTET
  const { baseSemi, num, den } = perSemitoneInfo(fret, divisions);
  return formatFractionLabel(baseSemi, num, den);
}

function labelFractions(fret, divisions) {
  const { baseSemi, num, den } = perSemitoneInfo(fret, divisions);
  return formatFractionLabel(baseSemi, num, den);
}

export function buildFretLabel(fret, divisions, opts = {}) {
  const style = opts.microStyle ?? MICRO_LABEL_STYLES.Letters;
  if (!Number.isFinite(fret) || !Number.isFinite(divisions) || divisions <= 0)
    return "";

  // 12‑TET trivial case
  if (divisions === 12) return String(fret);

  switch (style) {
    case MICRO_LABEL_STYLES.Fractions:
      return labelFractions(fret, divisions);
    case MICRO_LABEL_STYLES.Accidentals:
      return labelAccidentals(fret, divisions, opts.accidental);
    case MICRO_LABEL_STYLES.Letters:
    default:
      return labelLetters(fret, divisions);
  }
}

// Helper for tests and previews
export function sampleLabels(start, count, divisions, opts = {}) {
  return Array.from({ length: count }, (_, i) =>
    buildFretLabel(start + i, divisions, opts),
  );
}
