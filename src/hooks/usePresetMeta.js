import { useCallback, useMemo } from "react";
import { normalizePresetMeta } from "@/lib/meta/meta";

function normalizeBaseMeta({
  presetNames,
  presetMetaSource,
  savedMeta,
  systemId,
  strings,
}) {
  const metaForGroup = presetMetaSource?.[systemId]?.[strings] || {};
  const normalized = Object.create(null);

  (Array.isArray(presetNames) ? presetNames : []).forEach((name) => {
    if (name === "Saved default") {
      const normalizedSaved = normalizePresetMeta(savedMeta, {
        stringMetaFormat: "map",
      });
      if (normalizedSaved) normalized[name] = normalizedSaved;
      return;
    }

    const meta = normalizePresetMeta(metaForGroup?.[name], {
      stringMetaFormat: "map",
    });
    if (meta) normalized[name] = meta;
  });

  return normalized;
}

function normalizeCustomMeta(customTunings) {
  if (!Array.isArray(customTunings) || !customTunings.length) return {};
  const out = {};
  for (const pack of customTunings) {
    const name = typeof pack?.name === "string" ? pack.name : null;
    if (!name) continue;
    const meta = normalizePresetMeta(pack?.meta, { stringMetaFormat: "map" });
    if (meta) out[name] = meta;
  }
  return out;
}

export function usePresetMeta({
  presetNames = [],
  presetMetaSource,
  savedMeta,
  customTunings,
  systemId,
  strings,
  setStringMeta,
  setBoardMeta,
}) {
  const basePresetMetaMap = useMemo(
    () =>
      normalizeBaseMeta({
        presetNames,
        presetMetaSource,
        savedMeta,
        systemId,
        strings,
      }),
    [presetNames, presetMetaSource, savedMeta, systemId, strings],
  );

  const customPresetMetaMap = useMemo(
    () => normalizeCustomMeta(customTunings),
    [customTunings],
  );

  const mergedPresetMetaMap = useMemo(() => {
    const merged = { ...basePresetMetaMap };
    for (const [name, meta] of Object.entries(customPresetMetaMap)) {
      merged[name] = meta;
    }
    return merged;
  }, [basePresetMetaMap, customPresetMetaMap]);

  const getPresetMeta = useCallback(
    (name) => (name in mergedPresetMetaMap ? mergedPresetMetaMap[name] : null),
    [mergedPresetMetaMap],
  );

  const applyPresetMeta = useCallback(
    (name) => {
      const meta = getPresetMeta(name);
      if (meta?.stringMeta) setStringMeta?.(meta.stringMeta);
      else setStringMeta?.(null);
      if (meta?.board) setBoardMeta?.(meta.board);
      else setBoardMeta?.(null);
      return meta ?? null;
    },
    [getPresetMeta, setStringMeta, setBoardMeta],
  );

  const resetMetaForInstrumentChange = useCallback(() => {
    setStringMeta?.(null);
    setBoardMeta?.(null);
  }, [setStringMeta, setBoardMeta]);

  return useMemo(
    () => ({
      mergedPresetMetaMap,
      getPresetMeta,
      applyPresetMeta,
      resetMetaForInstrumentChange,
    }),
    [mergedPresetMetaMap, getPresetMeta, applyPresetMeta, resetMetaForInstrumentChange],
  );
}
