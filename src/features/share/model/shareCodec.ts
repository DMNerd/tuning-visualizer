import {
  FRETS_FACTORY,
  FRETS_MAX,
  FRETS_MIN,
  STR_FACTORY,
  STR_MAX,
  STR_MIN,
  SYSTEM_DEFAULT,
} from "@shared/config/appDefaults";
import { TUNINGS } from "@domain/theory/tuning";
import { stableStringify } from "@shared/lib/stableStringify";
import { SHARE_FIELD_SELECTORS } from "@features/share/model/shareScopes";
import {
  SHARE_QUERY_KEYS,
  SHARE_SCHEMA_VERSION,
} from "@features/share/model/shareSchema";
import {
  coerceNeckFilterMode,
  isNeckFilterMode,
  NECK_FILTER_MODES,
} from "@domain/presets/neckFilterModes";
import { matchesPack } from "@domain/presets/packIdentity";
import { isObjectLike, isPlainObject } from "@shared/lib/object";
import { trimmedString } from "@shared/lib/strings";
import { clampInteger } from "@shared/lib/math";

type ShareValues = Partial<{
  systemId: string;
  strings: number;
  frets: number;
  tuning: unknown[];
  stringMeta: unknown;
  boardMeta: unknown;
  neckFilterMode: "none" | "kg" | "fretless";
  presetName: string;
  packId: string;
  packPayloadVersion: number;
  packPayload: unknown;
  customTunings: unknown[];
  selectedPreset: string;
}>;

type NormalizedPackPayload = Record<string, unknown> & {
  name: string;
  meta?: Record<string, unknown>;
};

export type SharePayload = {
  version: number;
  values: ShareValues;
};

export type ParsedPayload = SharePayload;

export type InstrumentHydrationValues = {
  systemId: string;
  strings: number;
  frets: number;
  tuning: unknown[];
  stringMeta: unknown;
  boardMeta: unknown;
  neckFilterMode: "none" | "kg" | "fretless";
  presetName: string;
  packId?: string;
  packPayloadVersion?: number;
  packPayload?: unknown;
};

const FIELD_TO_VALUE_KEY = {
  systemId: "systemId",
  strings: "strings",
  frets: "frets",
  tuning: "tuning",
  stringMeta: "stringMeta",
  boardMeta: "boardMeta",
  neckFilterMode: "neckFilterMode",
  selectedPreset: "selectedPreset",
  customTunings: "customTunings",
} as const;

const SHARE_PACK_PAYLOAD_VERSION = 1;
const SHARE_SELECTORS = SHARE_FIELD_SELECTORS;

function normalizePackPayload(value: unknown): NormalizedPackPayload | null {
  if (!isPlainObject(value)) return null;
  const pack = value;
  const name = trimmedString(pack.name);
  if (!name) return null;

  const tuning = pack.tuning;
  if (!isPlainObject(tuning) || !Array.isArray(tuning.strings)) return null;

  const system = pack.system;
  if (!isPlainObject(system)) return null;
  const edo = system.edo;
  if (typeof edo !== "number" || !Number.isFinite(edo)) return null;

  return {
    ...pack,
    name,
  };
}

function resolveSelectedCustomPack(values: ShareValues) {
  const selectedPreset = trimmedString(values.selectedPreset);
  const list = Array.isArray(values.customTunings) ? values.customTunings : [];
  if (!selectedPreset || !list.length) return null;

  const match = list.find((entry) =>
    matchesPack(entry, { name: selectedPreset }),
  );
  const normalized = normalizePackPayload(match);
  if (!normalized) return null;

  return {
    presetName: selectedPreset,
    packId: trimmedString(normalized.meta?.id) || selectedPreset,
    packPayloadVersion: SHARE_PACK_PAYLOAD_VERSION,
    packPayload: normalized,
  };
}

function normalizePackPayloadVersion(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.trunc(value))
    : undefined;
}

function getByPath(source: unknown, path: string): unknown {
  if (!source || typeof source !== "object") return undefined;
  const parts = path.split(".");
  let cursor: unknown = source;
  for (const part of parts) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

function parseJson(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed;
  } catch {
    return undefined;
  }
}

function isJsonLike(value: string) {
  const first = value.trim().charAt(0);
  return first === "[" || first === "{";
}

export function encodeTuning(notes: unknown[]): string {
  const canUseCompactDottedEncoding =
    Array.isArray(notes) &&
    notes.length > 0 &&
    notes.every(
      (entry) =>
        typeof entry === "string" &&
        entry.length > 0 &&
        !entry.includes(".") &&
        !entry.includes("%"),
    );

  if (canUseCompactDottedEncoding) {
    return notes.join(".");
  }

  return stableStringify(notes);
}

export function decodeTuning(raw: string): unknown[] | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;

  if (!isJsonLike(raw)) {
    return raw.split(".").filter((entry) => entry.length > 0);
  }

  const parsed = parseJson(raw);
  return Array.isArray(parsed) ? parsed : undefined;
}

function normalizeValues(values: ShareValues): ShareValues {
  const next: ShareValues = {};

  if (typeof values.systemId === "string" && TUNINGS[values.systemId]) {
    if (values.systemId !== SYSTEM_DEFAULT) {
      next.systemId = values.systemId;
    }
  }

  const strings = clampInteger(values.strings, STR_MIN, STR_MAX, undefined);
  if (typeof strings === "number" && strings !== STR_FACTORY) {
    next.strings = strings;
  }

  const frets = clampInteger(values.frets, FRETS_MIN, FRETS_MAX, undefined);
  if (typeof frets === "number" && frets !== FRETS_FACTORY) {
    next.frets = frets;
  }

  if (Array.isArray(values.tuning) && values.tuning.length > 0) {
    next.tuning = values.tuning;
  }
  if (isObjectLike(values.stringMeta)) next.stringMeta = values.stringMeta;
  if (isObjectLike(values.boardMeta)) next.boardMeta = values.boardMeta;
  if (
    isNeckFilterMode(values.neckFilterMode) &&
    values.neckFilterMode !== NECK_FILTER_MODES.NONE
  ) {
    // Canonical persisted/share payload field. Legacy `kg` is parse-only fallback.
    next.neckFilterMode = values.neckFilterMode;
  }
  const selectedCustomPack = resolveSelectedCustomPack(values);
  if (selectedCustomPack) return { ...next, ...selectedCustomPack };

  const presetName = trimmedString(values.presetName);
  if (presetName) next.presetName = presetName;
  const packId = trimmedString(values.packId);
  if (packId) next.packId = packId;
  const packPayloadVersion = normalizePackPayloadVersion(
    values.packPayloadVersion,
  );
  if (packPayloadVersion != null) next.packPayloadVersion = packPayloadVersion;
  const packPayload = normalizePackPayload(values.packPayload);
  if (packPayload) next.packPayload = packPayload;

  return next;
}

export function buildSharePayload(appState: unknown): SharePayload {
  const rawValues: ShareValues = {};
  for (const [fieldName, selectorPath] of Object.entries(SHARE_SELECTORS)) {
    const valueKey =
      FIELD_TO_VALUE_KEY[fieldName as keyof typeof FIELD_TO_VALUE_KEY];
    if (!valueKey) continue;
    rawValues[valueKey] = getByPath(appState, selectorPath) as never;
  }

  return {
    version: SHARE_SCHEMA_VERSION,
    values: normalizeValues(rawValues),
  };
}

export function serializeSharePayload(payload: SharePayload): URLSearchParams {
  const params = new URLSearchParams();
  const values = normalizeValues(payload.values || {});

  params.set(SHARE_QUERY_KEYS.version, String(SHARE_SCHEMA_VERSION));

  const orderedKeys = Object.keys(SHARE_QUERY_KEYS).filter(
    (key) => key !== "version",
  ) as Array<keyof typeof SHARE_QUERY_KEYS>;

  for (const key of orderedKeys) {
    const value = values[key as keyof ShareValues];
    if (typeof value === "undefined") continue;

    if (typeof value === "boolean") {
      params.set(SHARE_QUERY_KEYS[key], value ? "1" : "0");
      continue;
    }

    if (typeof value === "number" || typeof value === "string") {
      params.set(SHARE_QUERY_KEYS[key], String(value));
      continue;
    }

    if (key === "tuning" && Array.isArray(value)) {
      params.set(SHARE_QUERY_KEYS[key], encodeTuning(value));
      continue;
    }

    params.set(SHARE_QUERY_KEYS[key], stableStringify(value));
  }

  return params;
}

function parseJsonObject(raw: string): object | undefined {
  const parsed = parseJson(raw);
  return isObjectLike(parsed) ? parsed : undefined;
}

type ParsedQueryKey = Exclude<
  keyof typeof SHARE_QUERY_KEYS,
  "version" | "neckFilterMode"
>;

const QUERY_VALUE_PARSERS: Record<ParsedQueryKey, (raw: string) => unknown> = {
  systemId: (raw) => raw,
  strings: (raw) => Number(raw),
  frets: (raw) => Number(raw),
  tuning: decodeTuning,
  stringMeta: parseJsonObject,
  boardMeta: parseJsonObject,
  presetName: (raw) => raw.trim(),
  packId: (raw) => raw.trim(),
  packPayloadVersion: (raw) => {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  },
  packPayload: (raw) => normalizePackPayload(parseJson(raw)) ?? undefined,
};

export function parseSharePayload(
  searchParams: URLSearchParams,
): ParsedPayload | null {
  const hasVersionParam = searchParams.has(SHARE_QUERY_KEYS.version);

  const rawValues: Record<string, unknown> = {};
  let matchedKnownValue = false;

  // Canonical parsing only: legacy aliases were removed with single-scope policy.
  // A non-empty param counts as a match even when its value fails to parse.
  for (const [key, parse] of Object.entries(QUERY_VALUE_PARSERS)) {
    const raw = searchParams.get(SHARE_QUERY_KEYS[key as ParsedQueryKey]);
    if (!raw) continue;
    matchedKnownValue = true;
    const parsed = parse(raw);
    if (parsed !== undefined) rawValues[key] = parsed;
  }

  // neckFilterMode matches on presence alone, even when empty.
  if (searchParams.has(SHARE_QUERY_KEYS.neckFilterMode)) {
    matchedKnownValue = true;
    const resolvedMode = coerceNeckFilterMode(
      searchParams.get(SHARE_QUERY_KEYS.neckFilterMode),
      NECK_FILTER_MODES.NONE,
    );
    if (resolvedMode !== NECK_FILTER_MODES.NONE) {
      rawValues.neckFilterMode = resolvedMode;
    }
  }

  const values = normalizeValues(rawValues);
  if (!matchedKnownValue && !hasVersionParam) {
    return null;
  }

  return {
    version: SHARE_SCHEMA_VERSION,
    values,
  };
}

export function resolveInstrumentHydrationValues(
  payload: ParsedPayload | null | undefined,
): InstrumentHydrationValues | null {
  if (!payload) return null;
  const values = payload.values || {};
  const packId = trimmedString(values.packId);
  const packPayloadVersion = normalizePackPayloadVersion(
    values.packPayloadVersion,
  );
  return {
    systemId:
      typeof values.systemId === "string" ? values.systemId : SYSTEM_DEFAULT,
    strings:
      typeof values.strings === "number" && Number.isFinite(values.strings)
        ? values.strings
        : STR_FACTORY,
    frets:
      typeof values.frets === "number" && Number.isFinite(values.frets)
        ? values.frets
        : FRETS_FACTORY,
    tuning: Array.isArray(values.tuning) ? values.tuning : [],
    stringMeta: isObjectLike(values.stringMeta) ? values.stringMeta : null,
    boardMeta: isObjectLike(values.boardMeta) ? values.boardMeta : null,
    neckFilterMode: coerceNeckFilterMode(
      values.neckFilterMode,
      NECK_FILTER_MODES.NONE,
    ),
    presetName: trimmedString(values.presetName),
    ...(packId ? { packId } : {}),
    ...(packPayloadVersion != null ? { packPayloadVersion } : {}),
    ...(isObjectLike(values.packPayload)
      ? { packPayload: values.packPayload }
      : {}),
  };
}
