import { normalizePresetMeta } from "@domain/meta/meta";
import { STR_MIN, STR_MAX } from "@shared/config/appDefaults";
import { coerceAnyTuning } from "@features/instrument/hooks/usePresetBuilder";
import { filterCompatibleCustoms } from "@features/instrument/model/presetMerging";

export function presetEntryKey(strings, name) {
  return `${strings}:${name}`;
}

function isValidStringCount(count) {
  return Number.isInteger(count) && count >= STR_MIN && count <= STR_MAX;
}

// The current count's merged map already holds its defaults and custom packs.
function* currentCountEntries({ strings, presetMap, metaMap, customNames }) {
  const customSet = new Set(customNames ?? []);
  for (const [name, tuning] of Object.entries(presetMap ?? {})) {
    if (!Array.isArray(tuning) || !tuning.length) continue;
    yield {
      name,
      strings,
      tuning,
      meta: metaMap?.[name],
      isCustom: customSet.has(name),
    };
  }
}

function* otherCountCatalogEntries({ catalog, meta, currentStrings }) {
  for (const [countKey, presets] of Object.entries(catalog ?? {})) {
    const count = Number(countKey);
    if (count === currentStrings) continue;
    for (const [name, value] of Object.entries(presets ?? {})) {
      const tuning = coerceAnyTuning(value);
      if (tuning?.length !== count) continue;
      const presetMeta = normalizePresetMeta(meta?.[countKey]?.[name]);
      yield { name, strings: count, tuning, meta: presetMeta };
    }
  }
}

function* otherCountCustomEntries({ customTunings, edo, currentStrings }) {
  // NaN leaves the string count unconstrained; only the EDO has to match.
  for (const pack of filterCompatibleCustoms(customTunings, edo, NaN)) {
    const tuning = coerceAnyTuning(pack);
    if (typeof pack.name !== "string" || !tuning?.length) continue;
    if (tuning.length === currentStrings) continue;
    const meta = normalizePresetMeta(pack.meta);
    yield {
      name: pack.name,
      strings: tuning.length,
      tuning,
      meta,
      isCustom: true,
    };
  }
}

/**
 * Flattens every preset available for the current tuning system — across all
 * string counts — into entries sorted by string count. The current string
 * count reuses the already-merged preset map (so it keeps "Factory default",
 * "Saved default" and custom packs exactly as the picker used to show them);
 * other counts are read from the static catalog plus EDO-compatible custom
 * packs. The first entry for a given count + name wins.
 */
export function buildPresetCatalog({
  systemId,
  edo,
  currentStrings,
  currentPresetMap,
  currentPresetMetaMap,
  currentCustomNames,
  presetTunings,
  presetMeta,
  customTunings,
}) {
  const sources = [
    currentCountEntries({
      strings: currentStrings,
      presetMap: currentPresetMap,
      metaMap: currentPresetMetaMap,
      customNames: currentCustomNames,
    }),
    otherCountCatalogEntries({
      catalog: presetTunings?.[systemId],
      meta: presetMeta?.[systemId],
      currentStrings,
    }),
    otherCountCustomEntries({ customTunings, edo, currentStrings }),
  ];

  const byKey = new Map();
  for (const source of sources) {
    for (const entry of source) {
      if (!isValidStringCount(entry.strings)) continue;
      const key = presetEntryKey(entry.strings, entry.name);
      if (byKey.has(key)) continue;
      byKey.set(key, {
        ...entry,
        key,
        meta: entry.meta ?? null,
        isCustom: Boolean(entry.isCustom),
      });
    }
  }
  // Stable sort: catalog order is kept within each string count.
  return [...byKey.values()].sort((a, b) => a.strings - b.strings);
}

/**
 * Groups entries by string count, keeping groups in first-appearance order:
 * the ascending catalog stays ascending, while a relevance-sorted search
 * result keeps its best match's group first.
 */
export function groupPresetsByStringCount(entries) {
  const groups = new Map();
  for (const entry of entries) {
    if (!groups.has(entry.strings)) groups.set(entry.strings, []);
    groups.get(entry.strings).push(entry);
  }
  return [...groups.entries()];
}
