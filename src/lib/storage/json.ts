export function safeJSONParse<T = unknown>(
  raw: string | null | undefined,
  fallback: T,
): T {
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeJSONStringify(value: unknown, fallback = "{}"): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}
