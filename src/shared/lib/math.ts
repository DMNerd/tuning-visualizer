export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new Error("clamp bounds must be finite numbers");
  }

  const safeValue = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, safeValue));
}

/** Positive-result modulo (unlike `%`, never returns a negative value for m > 0). */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Clamps a number or numeric string into range; anything else yields `fallback`. */
export function clampNumeric<T>(
  value: unknown,
  min: number,
  max: number,
  fallback: T,
): number | T {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : fallback;
}
