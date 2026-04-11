import {
  FRETS_FACTORY,
  FRETS_MAX,
  FRETS_MIN,
  STR_FACTORY,
  STR_MAX,
  STR_MIN,
  SYSTEM_DEFAULT,
} from "@/lib/config/appDefaults";
import { TUNINGS } from "@/lib/theory/tuning";
import { SHARE_FIELD_SELECTORS } from "@/lib/url/shareScopes";
import { SHARE_QUERY_KEYS, SHARE_SCHEMA_VERSION } from "@/lib/url/shareSchema";
import {
  coerceNeckFilterMode,
  isNeckFilterMode,
  NECK_FILTER_MODES,
} from "@/lib/presets/neckFilterModes";

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
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const pack = value as Record<string, unknown>;
  const name =
    typeof pack.name === "string" && pack.name.trim() ? pack.name.trim() : null;
  const tuning = pack.tuning;
  const system = pack.system;
  if (!name || !tuning || typeof tuning !== "object") return null;
  if (!system || typeof system !== "object") return null;
  return {
    ...pack,
    name,
  };
}

function resolveSelectedCustomPack(values: ShareValues) {
  const selectedPreset =
    typeof values.selectedPreset === "string"
      ? values.selectedPreset.trim()
      : "";
  const list = Array.isArray(values.customTunings) ? values.customTunings : [];
  if (!selectedPreset || !list.length) return null;

  const match =
    list.find((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const pack = entry as Record<string, unknown>;
      return pack.name === selectedPreset;
    }) || null;
  if (!match) return null;
  const normalized = normalizePackPayload(match);
  if (!normalized) return null;

  const packId =
    typeof normalized.meta?.id === "string" ? normalized.meta.id : "";
  return {
    presetName: selectedPreset,
    packId: packId.trim() || selectedPreset,
    packPayloadVersion: SHARE_PACK_PAYLOAD_VERSION,
    packPayload: normalized,
  };
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

function clampInt(value: unknown, min: number, max: number) {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(numeric)) return undefined;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function parseJson(value: string) {
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed;
  } catch {
    return undefined;
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
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

  const strings = clampInt(values.strings, STR_MIN, STR_MAX);
  if (typeof strings === "number" && strings !== STR_FACTORY) {
    next.strings = strings;
  }

  const frets = clampInt(values.frets, FRETS_MIN, FRETS_MAX);
  if (typeof frets === "number" && frets !== FRETS_FACTORY) {
    next.frets = frets;
  }

  if (Array.isArray(values.tuning) && values.tuning.length > 0) {
    next.tuning = values.tuning;
  }
  if (values.stringMeta && typeof values.stringMeta === "object") {
    next.stringMeta = values.stringMeta;
  }
  if (values.boardMeta && typeof values.boardMeta === "object") {
    next.boardMeta = values.boardMeta;
  }
  if (
    isNeckFilterMode(values.neckFilterMode) &&
    values.neckFilterMode !== NECK_FILTER_MODES.NONE
  ) {
    // Canonical persisted/share payload field. Legacy `kg` is parse-only fallback.
    next.neckFilterMode = values.neckFilterMode;
  }
  const selectedCustomPack = resolveSelectedCustomPack(values);
  if (selectedCustomPack) {
    next.presetName = selectedCustomPack.presetName;
    next.packId = selectedCustomPack.packId;
    next.packPayloadVersion = selectedCustomPack.packPayloadVersion;
    next.packPayload = selectedCustomPack.packPayload;
  } else {
    if (typeof values.presetName === "string" && values.presetName.trim()) {
      next.presetName = values.presetName.trim();
    }
    if (typeof values.packId === "string" && values.packId.trim()) {
      next.packId = values.packId.trim();
    }
    if (
      typeof values.packPayloadVersion === "number" &&
      Number.isFinite(values.packPayloadVersion)
    ) {
      next.packPayloadVersion = Math.max(
        1,
        Math.trunc(values.packPayloadVersion),
      );
    }
    const normalizedPackPayload = normalizePackPayload(values.packPayload);
    if (normalizedPackPayload) {
      next.packPayload = normalizedPackPayload;
    }
  }

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

export function parseSharePayload(
  searchParams: URLSearchParams,
): ParsedPayload | null {
  const hasVersionParam = searchParams.has(SHARE_QUERY_KEYS.version);

  const rawValues: ShareValues = {};
  let matchedKnownValue = false;

  // Canonical parsing only: legacy aliases were removed with single-scope policy.
  const systemId = searchParams.get(SHARE_QUERY_KEYS.systemId);
  if (systemId) {
    rawValues.systemId = systemId;
    matchedKnownValue = true;
  }

  const strings = searchParams.get(SHARE_QUERY_KEYS.strings);
  if (strings) {
    rawValues.strings = Number(strings);
    matchedKnownValue = true;
  }

  const frets = searchParams.get(SHARE_QUERY_KEYS.frets);
  if (frets) {
    rawValues.frets = Number(frets);
    matchedKnownValue = true;
  }

  const tuning = searchParams.get(SHARE_QUERY_KEYS.tuning);
  if (tuning) {
    const parsed = decodeTuning(tuning);
    if (Array.isArray(parsed)) rawValues.tuning = parsed;
    matchedKnownValue = true;
  }

  const stringMeta = searchParams.get(SHARE_QUERY_KEYS.stringMeta);
  if (stringMeta) {
    const parsed = parseJson(stringMeta);
    if (parsed && typeof parsed === "object") rawValues.stringMeta = parsed;
    matchedKnownValue = true;
  }

  const boardMeta = searchParams.get(SHARE_QUERY_KEYS.boardMeta);
  if (boardMeta) {
    const parsed = parseJson(boardMeta);
    if (parsed && typeof parsed === "object") rawValues.boardMeta = parsed;
    matchedKnownValue = true;
  }

  const hasCanonicalNm = searchParams.has(SHARE_QUERY_KEYS.neckFilterMode);
  const neckFilterMode = searchParams.get(SHARE_QUERY_KEYS.neckFilterMode);
  if (hasCanonicalNm) {
    const resolvedMode = coerceNeckFilterMode(
      neckFilterMode,
      NECK_FILTER_MODES.NONE,
    );
    if (resolvedMode !== NECK_FILTER_MODES.NONE) {
      rawValues.neckFilterMode = resolvedMode;
    }
    matchedKnownValue = true;
  }

  const presetName = searchParams.get(SHARE_QUERY_KEYS.presetName);
  if (presetName) {
    rawValues.presetName = presetName.trim();
    matchedKnownValue = true;
  }

  const packId = searchParams.get(SHARE_QUERY_KEYS.packId);
  if (packId) {
    rawValues.packId = packId.trim();
    matchedKnownValue = true;
  }

  const packPayloadVersion = searchParams.get(
    SHARE_QUERY_KEYS.packPayloadVersion,
  );
  if (packPayloadVersion) {
    const parsed = Number(packPayloadVersion);
    if (Number.isFinite(parsed)) rawValues.packPayloadVersion = parsed;
    matchedKnownValue = true;
  }

  const packPayload = searchParams.get(SHARE_QUERY_KEYS.packPayload);
  if (packPayload) {
    const parsed = parseJson(packPayload);
    const normalized = normalizePackPayload(parsed);
    if (normalized) rawValues.packPayload = normalized;
    matchedKnownValue = true;
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
    stringMeta:
      values.stringMeta && typeof values.stringMeta === "object"
        ? values.stringMeta
        : null,
    boardMeta:
      values.boardMeta && typeof values.boardMeta === "object"
        ? values.boardMeta
        : null,
    neckFilterMode: coerceNeckFilterMode(
      values.neckFilterMode,
      NECK_FILTER_MODES.NONE,
    ),
    presetName:
      typeof values.presetName === "string" ? values.presetName.trim() : "",
    ...(typeof values.packId === "string" && values.packId.trim()
      ? { packId: values.packId.trim() }
      : {}),
    ...(typeof values.packPayloadVersion === "number" &&
    Number.isFinite(values.packPayloadVersion)
      ? {
          packPayloadVersion: Math.max(
            1,
            Math.trunc(values.packPayloadVersion),
          ),
        }
      : {}),
    ...(values.packPayload && typeof values.packPayload === "object"
      ? { packPayload: values.packPayload }
      : {}),
  };
}
