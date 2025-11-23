import { isPlainObject } from "@/utils/object";

export type StringMeta = {
  index: number;
  startFret?: number;
  greyBefore?: boolean;
  notePlacement?: "between" | "onFret";
};

export type BoardMeta = {
  fretStyle?: "solid" | "dotted";
  notePlacement?: "between" | "onFret";
};

export type TuningPresetMeta = {
  stringMeta?: StringMeta[] | Map<number, StringMeta> | null;
  board?: BoardMeta | null;
};

export function normalizeStringMeta(arr: unknown[]): StringMeta[] {
  return (Array.isArray(arr) ? arr : []).map((m): StringMeta => {
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

export type NormalizePresetMetaOptions = {
  stringMetaFormat?: "map" | "array";
};

type NormalizedStringMeta = Map<number, StringMeta> | StringMeta[];

function toStringMetaMapFromUnknown(
  value: unknown,
): Map<number, StringMeta> | null {
  if (value == null) return null;
  if (value instanceof Map) {
    return new Map<number, StringMeta>(value);
  }
  if (Array.isArray(value)) {
    return toStringMetaMap(value);
  }
  if (isPlainObject(value)) {
    return toStringMetaMap(Object.values(value));
  }
  return null;
}

function toStringMetaArrayFromUnknown(value: unknown): StringMeta[] | null {
  if (value == null) return null;

  if (value instanceof Map) {
    return normalizeStringMeta(
      Array.from(
        (value as Map<unknown, unknown>).values() as Iterable<unknown>,
      ),
    );
  }

  if (Array.isArray(value)) {
    return normalizeStringMeta(value as unknown[]);
  }

  if (isPlainObject(value)) {
    return normalizeStringMeta(Object.values(value));
  }

  return null;
}

export function normalizePresetMeta(
  meta: unknown,
  options: NormalizePresetMetaOptions = {},
): (TuningPresetMeta & { stringMeta?: NormalizedStringMeta | null }) | null {
  if (meta == null) return null;

  const format = options.stringMetaFormat ?? "map";
  let stringMetaSource: unknown = null;
  let boardSource: unknown = null;

  if (meta instanceof Map || Array.isArray(meta)) {
    stringMetaSource = meta;
  } else if (isPlainObject(meta)) {
    const obj = meta;
    stringMetaSource = obj.stringMeta ?? null;
    boardSource = obj.board ?? null;
  } else {
    return null;
  }

  const board = isPlainObject(boardSource) ? (boardSource as BoardMeta) : null;
  const stringMeta =
    format === "map"
      ? toStringMetaMapFromUnknown(stringMetaSource)
      : toStringMetaArrayFromUnknown(stringMetaSource);

  if (!stringMeta && !board) {
    return null;
  }

  const result: Record<string, unknown> = {};
  if (stringMeta) {
    result.stringMeta = stringMeta;
  }
  if (board) {
    result.board = board;
  }

  return result as TuningPresetMeta & {
    stringMeta?: NormalizedStringMeta | null;
  };
}
