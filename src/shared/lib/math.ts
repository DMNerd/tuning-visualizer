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
