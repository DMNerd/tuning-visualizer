import { useMemo } from "react";
import { normalizePresetMeta } from "@/lib/meta/meta";
import { normalizeIntlNoteName } from "@/lib/theory/notation";
import { isGermanicSpellingMarker } from "@/lib/theory/notation";
import { isPlainObject } from "@/utils/object";

function isGermanicPresetSpelling(value) {
  if (!isPlainObject(value)) return false;
  const rawHints = [
    value?.spelling,
    value?.noteNaming,
    value?.naming,
    value?.notation,
    value?.meta?.spelling,
    value?.meta?.noteNaming,
  ];
  for (const hint of rawHints) {
    if (isGermanicSpellingMarker(hint)) return true;
  }
  return false;
}

export function coerceTuningArray(strings, options = {}) {
  const { translateGerman = false } = options;
  if (!Array.isArray(strings)) return null;
  const out = strings
    .map((entry) => {
      if (typeof entry === "string")
        return normalizeIntlNoteName(entry, { translateGerman });
      if (typeof entry === "number" && Number.isFinite(entry))
        return String(entry);
      if (isPlainObject(entry)) {
        if (typeof entry.note === "string") {
          return normalizeIntlNoteName(entry.note, { translateGerman });
        }
        if (typeof entry.midi === "number" && Number.isFinite(entry.midi)) {
          return String(entry.midi);
        }
      }
      return null;
    })
    .filter(Boolean);
  return out.length ? out : null;
}

export function coerceAnyTuning(value, options = {}) {
  if (Array.isArray(value)) return coerceTuningArray(value, options);
  if (isPlainObject(value)) {
    const translateGerman =
      typeof options.translateGerman === "boolean"
        ? options.translateGerman
        : isGermanicPresetSpelling(value);
    return coerceTuningArray(value?.tuning?.strings, { translateGerman });
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
