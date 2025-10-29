export type StringMeta = {
  index: number;
  startFret?: number;
  greyBefore?: boolean;
  notePlacement?: "between" | "onFret";
  fretStyle?: "solid" | "dotted";
};

export type BoardMeta = {
  fretStyle?: "solid" | "dotted";
  notePlacement?: "between" | "onFret";
};

export type TuningPresetMeta = {
  stringMeta?: StringMeta[] | null;
  board?: BoardMeta | null;
};

export function normalizeStringMeta(arr: unknown[]): StringMeta[] {
  return (Array.isArray(arr) ? arr : []).map((m) => {
    const meta = (m ?? {}) as Partial<StringMeta>;
    return {
      ...meta,
      index: meta.index ?? 0,
      startFret: meta.startFret ?? 0,
      greyBefore: meta.greyBefore ?? true,
    };
  });
}

export function toStringMetaMap(meta: unknown): Map<number, StringMeta> {
  const source: unknown[] = Array.isArray(meta) ? (meta as unknown[]) : [];
  const normalized = normalizeStringMeta(source);
  const map = new Map<number, StringMeta>();

  normalized.forEach((norm, idx) => {
    const original = source[idx];
    const originalObj =
      original !== null && typeof original === "object"
        ? (original as Record<string, unknown>)
        : undefined;

    const hasIndex = originalObj
      ? Object.prototype.hasOwnProperty.call(originalObj, "index")
      : false;
    const hasStartFret = originalObj
      ? Object.prototype.hasOwnProperty.call(originalObj, "startFret")
      : false;
    const hasGreyBefore = originalObj
      ? Object.prototype.hasOwnProperty.call(originalObj, "greyBefore")
      : false;

    const rawIndex = hasIndex ? originalObj?.index : undefined;
    const index =
      typeof rawIndex === "number" && Number.isFinite(rawIndex)
        ? rawIndex
        : norm.index;

    const value: Record<string, unknown> = {
      ...(originalObj ?? {}),
      index,
    };

    if (!hasStartFret) {
      value.startFret = norm.startFret;
    }

    if (!hasGreyBefore) {
      value.greyBefore = norm.greyBefore;
    }

    map.set(index, value as StringMeta);
  });

  return map;
}
