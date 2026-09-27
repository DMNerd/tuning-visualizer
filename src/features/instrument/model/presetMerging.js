import { isPlainObject } from "@shared/lib/object";

const RESERVED_PRESET_NAMES = new Set(["Factory default", "Saved default"]);

export function omitReservedPresetNames(map) {
  const out = {};
  for (const [name, value] of Object.entries(map || {})) {
    if (RESERVED_PRESET_NAMES.has(name)) continue;
    out[name] = value;
  }
  return out;
}

export function areTuningsEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// A value only constrains the match when both sides are finite numbers.
function finiteMismatch(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) && a !== b;
}

// Custom packs usable with the current instrument (same EDO and string count).
export function filterCompatibleCustoms(
  customTunings,
  currentEdo,
  currentStrings,
) {
  if (!Array.isArray(customTunings) || !customTunings.length) return [];
  const edo = Number(currentEdo);
  const stringCount = Number(currentStrings);
  return customTunings.filter(
    (t) =>
      isPlainObject(t) &&
      Array.isArray(t.tuning?.strings) &&
      !finiteMismatch(t.tuning.strings.length, stringCount) &&
      !finiteMismatch(Number(t.system?.edo), edo),
  );
}

export function findPackByName(packs, name) {
  return packs.find((p) => p?.name === name) ?? null;
}
