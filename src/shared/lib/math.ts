export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new Error("clamp bounds must be finite numbers");
  }

  const safeValue = Number.isFinite(value) ? value : min;
  return Math.max(min, Math.min(max, safeValue));
}
