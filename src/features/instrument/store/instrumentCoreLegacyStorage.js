import {
  STR_FACTORY,
  FRETS_FACTORY,
  STR_MIN,
  STR_MAX,
  FRETS_MIN,
  FRETS_MAX,
} from "@shared/config/appDefaults";
import { STORAGE_KEYS } from "@shared/lib/storage/storageKeys";
import {
  getLocalStorage,
  readLegacyJSON,
} from "@shared/lib/storage/scopedStorage";
import { clampNumeric } from "@shared/lib/math";
import { isPlainObject } from "@shared/lib/object";
import { createLegacyKeyCleanup } from "@shared/lib/storage/legacyKeyCleanup";

// Pre-persist instrument storage: strings/frets under their own keys, and the
// user default-tuning map under a global (unscoped) key that stays the source
// of truth across windows.
let lastSerializedGlobalDefaultTuningMap = null;

function readLegacyNumber(key, min, max, fallback) {
  const storage = getLocalStorage();
  if (!storage) return { value: fallback, found: false };
  const raw = storage.getItem(key);
  return {
    value: clampNumeric(raw, min, max, fallback),
    found: raw !== null,
  };
}

export function readLegacyInstrumentCore() {
  const strings = readLegacyNumber(
    STORAGE_KEYS.STRINGS,
    STR_MIN,
    STR_MAX,
    STR_FACTORY,
  );
  const frets = readLegacyNumber(
    STORAGE_KEYS.FRETS,
    FRETS_MIN,
    FRETS_MAX,
    FRETS_FACTORY,
  );
  const defaults = readLegacyDefaultTuningMap();
  return {
    strings,
    frets,
    defaults,
    hasLegacyKeys: strings.found || frets.found || defaults.found,
  };
}

function readLegacyDefaultTuningMap() {
  const storage = getLocalStorage();
  if (!storage) return { value: {}, found: false };

  const raw = storage.getItem(STORAGE_KEYS.USER_DEFAULT_TUNING);
  if (!raw) return { value: {}, found: false };

  const parsed = readLegacyJSON(STORAGE_KEYS.USER_DEFAULT_TUNING);
  if (isPlainObject(parsed)) {
    lastSerializedGlobalDefaultTuningMap = raw;
  }
  return { value: isPlainObject(parsed) ? parsed : {}, found: true };
}

function serializeDefaultTuningMap(value) {
  return JSON.stringify(isPlainObject(value) ? value : {});
}

export function syncGlobalDefaultTunings(value) {
  if (typeof globalThis.localStorage === "undefined") return;
  const serialized = serializeDefaultTuningMap(value);
  if (serialized === lastSerializedGlobalDefaultTuningMap) {
    return;
  }
  try {
    globalThis.localStorage.setItem(
      STORAGE_KEYS.USER_DEFAULT_TUNING,
      serialized,
    );
    lastSerializedGlobalDefaultTuningMap = serialized;
  } catch {
    // Ignore write failures.
  }
}

const legacyCoreKeyCleanup = createLegacyKeyCleanup([
  STORAGE_KEYS.STRINGS,
  STORAGE_KEYS.FRETS,
]);

export function primeGlobalDefaultTuningCache(value) {
  lastSerializedGlobalDefaultTuningMap = serializeDefaultTuningMap(value);
}

export const markLegacyInstrumentCoreKeysForCleanup = legacyCoreKeyCleanup.mark;

// Removes the pre-persist per-key entries once, after a successful rehydrate.
export const cleanupLegacyInstrumentCoreKeys = legacyCoreKeyCleanup.run;
