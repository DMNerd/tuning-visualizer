import fractionUnicodeModule from "fraction-unicode";

type FractionUnicodeFn = (numerator: number, denominator: number) => string;

const fractionUnicode: FractionUnicodeFn =
  typeof fractionUnicodeModule === "function"
    ? fractionUnicodeModule
    : (fractionUnicodeModule as { default: FractionUnicodeFn }).default;

export const MICRO_LABEL_STYLES = {
  Letters: "letters",
  Accidentals: "accidentals",
  Fractions: "fractions",
} as const;

export type MicroLabelStyle =
  (typeof MICRO_LABEL_STYLES)[keyof typeof MICRO_LABEL_STYLES];

type Accidental = "sharp" | "flat";

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

function simplify(n: number, d: number): [number, number] {
  if (n === 0) return [0, 1];
  const g = gcd(n, d);
  return [Math.floor(n / g), Math.floor(d / g)];
}

function formatFractionLabel(
  baseSemi: number,
  num: number,
  den: number,
): string {
  if (num === 0) return String(baseSemi);
  if (num === den) return String(baseSemi + 1);

  // reduce and try to use a single glyph if available
  const [n, d] = simplify(num, den);
  const glyph = fractionUnicode(n, d);
  if (glyph.length === 1) return `${baseSemi}${glyph}`; // e.g., 6½

  // Prefix with "+" so multi-character fractions stay readable next to the base semitone.
  return `${baseSemi}+${glyph}`; // e.g., 6+⁵⁄₁₂
}

function perSemitoneInfo(
  fret: number,
  divisions: number,
): { baseSemi: number; num: number; den: number } {
  // position expressed in 12-TET semitone units
  const pos12 = (fret * 12) / divisions;
  const baseSemi = Math.floor(pos12);
  const micro = pos12 - baseSemi; // 0..1
  const num = Math.round(micro * divisions); // numerator relative to divisions
  const den = divisions; // denominator stays as system divisions
  return { baseSemi, num, den };
}

function labelLetters(fret: number, divisions: number): string {
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

function labelAccidentals(
  fret: number,
  divisions: number,
  accidental: Accidental = "sharp",
): string {
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

function labelFractions(fret: number, divisions: number): string {
  const { baseSemi, num, den } = perSemitoneInfo(fret, divisions);
  return formatFractionLabel(baseSemi, num, den);
}

export interface BuildFretLabelOptions {
  microStyle?: MicroLabelStyle;
  accidental?: Accidental;
}

export function buildFretLabel(
  fret: number,
  divisions: number,
  opts: BuildFretLabelOptions = {},
): string {
  const style = opts.microStyle ?? MICRO_LABEL_STYLES.Letters;
  if (!Number.isFinite(fret) || !Number.isFinite(divisions) || divisions <= 0)
    return "";

  // 12-TET trivial case
  if (divisions === 12) return String(fret);

  switch (style) {
    case MICRO_LABEL_STYLES.Fractions:
      return labelFractions(fret, divisions);
    case MICRO_LABEL_STYLES.Accidentals:
      return labelAccidentals(fret, divisions, opts.accidental ?? "sharp");
    case MICRO_LABEL_STYLES.Letters:
    default:
      return labelLetters(fret, divisions);
  }
}

// Helper for tests and previews
export function sampleLabels(
  start: number,
  count: number,
  divisions: number,
  opts: BuildFretLabelOptions = {},
): string[] {
  return Array.from({ length: count }, (_, i) =>
    buildFretLabel(start + i, divisions, opts),
  );
}
