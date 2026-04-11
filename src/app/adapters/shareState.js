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
 * Build a single share-relevant shape sourced from app domain hooks.
 * This avoids deep store reads in UI and keeps codec input serializable.
 */
export function buildShareDomainState({ theoryDomain, instrumentDomain }) {
  const theory = theoryDomain || {};
  const instrument = instrumentDomain || {};

  const theorySystem = theory.system || {};

  const instrumentState = instrument.instrumentState || {};
  const instrumentPresets = instrument.presets || {};
  const instrumentCustomTunings = instrument.customTunings || {};

  return {
    theory: {
      system: {
        systemId:
          typeof theorySystem.systemId === "string"
            ? theorySystem.systemId
            : undefined,
      },
    },
    instrument: {
      instrumentState: {
        strings: normalizeNumber(instrumentState.strings, undefined),
        frets: normalizeNumber(instrumentState.frets, undefined),
        tuning: Array.isArray(instrumentState.tuning)
          ? toPlainSerializable(instrumentState.tuning)
          : undefined,
        stringMeta: toPlainSerializable(instrumentState.stringMeta),
        boardMeta: toPlainSerializable(instrumentState.boardMeta),
        neckFilterMode: (() => {
          const mode = coerceNeckFilterMode(instrumentState.neckFilterMode);
          return mode === NECK_FILTER_MODES.NONE ? undefined : mode;
        })(),
      },
      presets: {
        selectedPreset:
          typeof instrumentPresets.selectedPreset === "string"
            ? instrumentPresets.selectedPreset
            : undefined,
      },
      customTunings: Array.isArray(instrumentCustomTunings.customTunings)
        ? toPlainSerializable(instrumentCustomTunings.customTunings)
        : undefined,
    },
  };
}
