/**
 * Build a human-friendly label for a fret index f
 * on an N-division temperament, referenced to 12-TET.
 *
 * Examples:
 *  - If N divides 12 (e.g., 24): 1a, 1b, 2a, ... between integers
 *  - Otherwise: 1+5/19 for fractional semitone positions
 */
export function buildFretLabel(f, divisions) {
  const rem = (f * 12) % divisions;
  const semi = Math.floor((f * 12) / divisions);
  if (rem === 0) return String(semi);

  if (divisions % 12 === 0) {
    const perSemi = divisions / 12;
    const sub = f % perSemi;
    const letters = "abcdefghijklmnopqrstuvwxyz";
    const suffix = letters[sub - 1] ?? `.${sub}`;
    return `${semi}${suffix}`;
  }

  return `${semi}+${rem}/${divisions}`;
}
