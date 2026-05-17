export function coerceWithFallback(value, fallback, coerce) {
  const coerced = coerce ? coerce(value) : value;
  return coerced ?? fallback;
}

export function resolveNextValue(next, prev, fallback, coerce) {
  const base = coerceWithFallback(prev, fallback, coerce);
  const resolved = typeof next === "function" ? next(base) : next;
  return coerceWithFallback(resolved, fallback, coerce);
}
