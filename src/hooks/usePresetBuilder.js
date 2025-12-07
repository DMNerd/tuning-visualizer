import { useMemo } from "react";
import { normalizePresetMeta } from "@/lib/meta/meta";
import { isPlainObject } from "@/utils/object";

export function coerceTuningArray(strings) {
  if (!Array.isArray(strings)) return null;
  const out = strings
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (typeof entry === "number" && Number.isFinite(entry))
        return String(entry);
      if (isPlainObject(entry)) {
        if (typeof entry.note === "string") return entry.note;
        if (typeof entry.midi === "number" && Number.isFinite(entry.midi)) {
          return String(entry.midi);
        }
      }
      return null;
    })
    .filter(Boolean);
  return out.length ? out : null;
}

export function coerceAnyTuning(value) {
  if (Array.isArray(value)) return coerceTuningArray(value);
  if (isPlainObject(value)) {
    return coerceTuningArray(value?.tuning?.strings);
  }
  return null;
}

function normalizeMeta(meta, format) {
  return normalizePresetMeta(meta, { stringMetaFormat: format }) || null;
}

export function usePresetBuilder({
  factory,
  saved,
  savedMeta,
  catalogPresets,
  catalogMeta,
  customPacks,
  stringMetaFormat = "map",
}) {
  return useMemo(() => {
    const presetMap = {};
    const presetMetaMap = {};

    if (Array.isArray(factory) && factory.length) {
      presetMap["Factory default"] = factory;
      presetMetaMap["Factory default"] = null;
    }

    if (Array.isArray(saved) && saved.length) {
      presetMap["Saved default"] = saved;
      presetMetaMap["Saved default"] = normalizeMeta(
        savedMeta,
        stringMetaFormat,
      );
    }

    const catalogEntries = Object.entries(catalogPresets || {});
    for (const [name, value] of catalogEntries) {
      if (name in presetMap) continue;
      const tuning = coerceAnyTuning(value);
      if (!tuning?.length) continue;
      presetMap[name] = tuning;
      presetMetaMap[name] = normalizeMeta(
        catalogMeta ? catalogMeta[name] : null,
        stringMetaFormat,
      );
    }

    const customs = Array.isArray(customPacks) ? customPacks : [];
    for (const pack of customs) {
      const name = typeof pack?.name === "string" ? pack.name : null;
      if (!name || name in presetMap) continue;
      const tuning = coerceAnyTuning(pack);
      if (!tuning?.length) continue;
      presetMap[name] = tuning;
      presetMetaMap[name] = normalizeMeta(pack?.meta, stringMetaFormat);
    }

    return {
      presetMap,
      presetMetaMap,
      presetNames: Object.keys(presetMap),
    };
  }, [
    factory,
    saved,
    savedMeta,
    catalogPresets,
    catalogMeta,
    customPacks,
    stringMetaFormat,
  ]);
}
