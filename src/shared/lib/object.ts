export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isObjectLike(value: unknown): value is object {
  return value !== null && typeof value === "object";
}

export function uniq<T>(items: readonly T[]): T[] {
  return Array.from(new Set(items));
}
