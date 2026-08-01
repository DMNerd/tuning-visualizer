export function generateId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${now}-${rand}`;
}
