import { isPlainObject } from "@shared/lib/object";

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function nonEmptyTrimmed(value) {
  return typeof value === "string" ? value.trim() : "";
}

function flattenOnce(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.some(Array.isArray) ? arr.flat() : arr;
}

const LEGACY_STRING_KEYS = [
  "strings",
  "tuning",
  "notes",
  "tokens",
  "pitches",
  "values",
];

function findLegacyStringSource(value) {
  if (Array.isArray(value)) return flattenOnce(value);
  if (!isPlainObject(value)) return null;

  const tuning = value.tuning;
  if (Array.isArray(tuning)) return flattenOnce(tuning);
  if (isPlainObject(tuning) && Array.isArray(tuning.strings)) {
    return flattenOnce(tuning.strings);
  }

  const key = LEGACY_STRING_KEYS.find((k) => Array.isArray(value[k]));
  if (key) return flattenOnce(value[key]);

  for (const wrapper of ["data", "payload"]) {
    const resolved = value[wrapper] && findLegacyStringSource(value[wrapper]);
    if (resolved) return resolved;
  }
  return null;
}

// Older exports named the note field differently; first non-empty wins.
const LEGACY_NOTE_KEYS = ["note", "token", "pitch", "value"];

function normalizeLegacyObjectEntry(entry) {
  const normalized = {};
  if (typeof entry.label === "string") normalized.label = entry.label;
  const note = LEGACY_NOTE_KEYS.map((k) => nonEmptyTrimmed(entry[k])).find(
    Boolean,
  );
  if (note) normalized.note = note;
  if (isFiniteNumber(entry.midi)) normalized.midi = entry.midi;
  if (isFiniteNumber(entry.startFret)) normalized.startFret = entry.startFret;
  if (typeof entry.greyBefore === "boolean") {
    normalized.greyBefore = entry.greyBefore;
  }
  return note || "midi" in normalized ? normalized : null;
}

function normalizeLegacyStringEntry(entry) {
  if (isPlainObject(entry)) return normalizeLegacyObjectEntry(entry);
  const note = nonEmptyTrimmed(entry);
  if (note) return { note };
  if (isFiniteNumber(entry)) return { midi: entry };
  return null;
}

function normalizeLegacyStrings(value) {
  const source = findLegacyStringSource(value);
  if (!Array.isArray(source) || !source.length) return null;
  const normalized = source.map(normalizeLegacyStringEntry).filter(Boolean);
  return normalized.length ? normalized : null;
}

function resolveLegacyEdo(pack) {
  for (const candidate of [pack?.system?.edo, pack?.edo]) {
    const edo = Number(candidate);
    if (Number.isFinite(edo) && edo > 0) return Math.trunc(edo);
  }
  return null;
}

// Upgrades a persisted custom-tuning pack from older export formats (version
// field, bare string/number tuning arrays, top-level edo). Returns the same
// reference when nothing needed changing.
export function upgradeLegacyPack(pack) {
  if (!isPlainObject(pack)) return pack;

  let changed = false;
  const next = { ...pack };

  if ("version" in next) {
    delete next.version;
    changed = true;
  }

  const existingStrings = Array.isArray(next?.tuning?.strings)
    ? next.tuning.strings
    : null;
  const needsStringUpgrade =
    !existingStrings || existingStrings.some((entry) => !isPlainObject(entry));
  if (needsStringUpgrade) {
    const normalized = normalizeLegacyStrings(
      existingStrings ? { strings: existingStrings } : next,
    );
    if (normalized) {
      next.tuning = { strings: normalized };
      changed = true;
    }
  }

  const edo = resolveLegacyEdo(next);
  if (edo != null && (!isPlainObject(next.system) || next.system.edo !== edo)) {
    next.system = { edo };
    changed = true;
  }

  return changed ? next : pack;
}
