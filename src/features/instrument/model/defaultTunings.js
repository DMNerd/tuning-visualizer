import { normalizePresetMeta } from "@domain/meta/meta";
import { isPlainObject } from "@shared/lib/object";

// Resolution of a (systemId, string count)'s default tuning from the user's
// saved defaults, the per-system factory table, and the 12-TET table.

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

export function defaultTuningKey(systemId, strings) {
  return `${systemId}:${strings}`;
}

// Saved entries are either a bare tuning array (legacy) or { tuning, meta }.
export function normalizeSavedEntry(raw) {
  if (Array.isArray(raw)) {
    return { tuning: raw, meta: null };
  }
  if (isPlainObject(raw)) {
    const tuning = Array.isArray(raw.tuning) ? raw.tuning : null;
    const meta = normalizePresetMeta(raw.meta, { stringMetaFormat: "array" });
    if (isNonEmptyArray(tuning)) {
      return { tuning, meta };
    }
  }
  return { tuning: null, meta: null };
}

function copyOrEmpty(tuning) {
  return Array.isArray(tuning) ? tuning.slice() : [];
}

// System table, then the user's saved tuning, then the 12-TET table.
export function resolveFactoryDefault(
  defaultTunings,
  systemId,
  strings,
  saved,
) {
  const systemDefaults = defaultTunings?.[systemId]?.[strings];
  if (isNonEmptyArray(systemDefaults)) return systemDefaults.slice();
  if (isNonEmptyArray(saved)) return saved.slice();
  const twelveTetFallback = defaultTunings?.["12-TET"]?.[strings];
  if (isNonEmptyArray(twelveTetFallback)) return twelveTetFallback.slice();
  return copyOrEmpty(saved);
}

// Saved tuning for that count, then system table, then 12-TET table, then the
// current tuning if it already has that many strings.
export function resolveDefaultForCount({
  userDefaultTuningMap,
  defaultTunings,
  systemId,
  count,
  tuning,
}) {
  const saved = normalizeSavedEntry(
    userDefaultTuningMap?.[defaultTuningKey(systemId, count)],
  ).tuning;
  if (isNonEmptyArray(saved)) return saved.slice();
  const systemDefaults = defaultTunings?.[systemId]?.[count];
  if (isNonEmptyArray(systemDefaults)) return systemDefaults.slice();
  const fallbackDefaults = defaultTunings?.["12-TET"]?.[count];
  if (isNonEmptyArray(fallbackDefaults)) return fallbackDefaults.slice();
  if (Array.isArray(tuning) && tuning.length === count) return tuning.slice();
  return [];
}

export function isSameTuning(tuning, reference) {
  return (
    Array.isArray(reference) &&
    tuning.length === reference.length &&
    tuning.every((value, index) => value === reference[index])
  );
}

export function buildSavedDefaultEntry(tuning, stringMeta, boardMeta) {
  const metaInput = {
    ...(isNonEmptyArray(stringMeta) ? { stringMeta } : {}),
    ...(isPlainObject(boardMeta) ? { board: boardMeta } : {}),
  };
  const normalizedMeta = normalizePresetMeta(metaInput, {
    stringMetaFormat: "array",
  });
  return {
    tuning: copyOrEmpty(tuning),
    ...(normalizedMeta ? { meta: normalizedMeta } : {}),
  };
}
