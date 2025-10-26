export type StringMeta = {
  index: number; // zero-based string index
  startFret?: number; // first playable fret on this string
  greyBefore?: boolean; // grey out nut→startFret
};

export function normalizeStringMeta(arr: unknown[]): StringMeta[] {
  return (Array.isArray(arr) ? arr : []).map((m) => {
    const meta = m as Partial<StringMeta>;
    return {
      index: meta.index ?? 0,
      startFret: meta.startFret ?? 0,
      greyBefore: meta.greyBefore ?? true,
    };
  });
}
