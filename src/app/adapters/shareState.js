import {
  coerceNeckFilterMode,
  NECK_FILTER_MODES,
} from "@/lib/presets/neckFilterModes";

function toPlainSerializable(value) {
  if (value === null) return null;

  const valueType = typeof value;
  if (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => toPlainSerializable(entry))
      .filter((entry) => typeof entry !== "undefined");
  }

  if (valueType !== "object") {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Set) {
    return Array.from(value, (entry) => toPlainSerializable(entry)).filter(
      (entry) => typeof entry !== "undefined",
    );
  }

  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries())
        .map(([key, entry]) => [String(key), toPlainSerializable(entry)])
        .filter(([, entry]) => typeof entry !== "undefined"),
    );
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([key, entry]) => [key, toPlainSerializable(entry)])
      .filter(([, entry]) => typeof entry !== "undefined"),
  );
}

function normalizeNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Build a single share-relevant shape sourced from selected app domain slices.
 * This keeps panel-model state cheap and stable (no deep serialization here).
 */
export function buildRawShareState({
  systemId,
  strings,
  frets,
  tuning,
  stringMeta,
  boardMeta,
  neckFilterMode,
  selectedPreset,
  customTunings,
}) {
  const coercedNeckFilterMode = coerceNeckFilterMode(neckFilterMode);

  return {
    theory: {
      system: {
        systemId: typeof systemId === "string" ? systemId : undefined,
      },
    },
    instrument: {
      instrumentState: {
        strings: normalizeNumber(strings, undefined),
        frets: normalizeNumber(frets, undefined),
        tuning: Array.isArray(tuning) ? tuning : undefined,
        stringMeta,
        boardMeta,
        neckFilterMode:
          coercedNeckFilterMode === NECK_FILTER_MODES.NONE
            ? undefined
            : coercedNeckFilterMode,
      },
      presets: {
        selectedPreset:
          typeof selectedPreset === "string" ? selectedPreset : undefined,
      },
      customTunings: Array.isArray(customTunings) ? customTunings : undefined,
    },
  };
}

/**
 * Convert raw share state into plain JSON-serializable values for share/export.
 */
export function serializeShareState(rawShareState) {
  const state = rawShareState || {};
  const instrument = state.instrument || {};
  const instrumentState = instrument.instrumentState || {};

  return {
    ...state,
    instrument: {
      ...instrument,
      instrumentState: {
        ...instrumentState,
        tuning: Array.isArray(instrumentState.tuning)
          ? toPlainSerializable(instrumentState.tuning)
          : undefined,
        stringMeta: toPlainSerializable(instrumentState.stringMeta),
        boardMeta: toPlainSerializable(instrumentState.boardMeta),
      },
      customTunings: Array.isArray(instrument.customTunings)
        ? toPlainSerializable(instrument.customTunings)
        : undefined,
    },
  };
}
