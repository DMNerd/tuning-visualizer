import { useMemo, useState, useCallback } from "react";

export function useMergedPresets({
  presetMap,
  presetMetaMap,
  presetNames,
  customTunings,
  setTuning,
  setStringMeta,
}) {
  const customPresetMap = useMemo(() => {
    if (!Array.isArray(customTunings) || !customTunings.length) return {};
    const obj = {};
    for (const p of customTunings) {
      const arr = Array.isArray(p?.tuning?.strings)
        ? p.tuning.strings.map((s) =>
            typeof s?.note === "string" ? s.note : "C",
          )
        : null;
      if (arr && arr.length) obj[p.name] = arr;
    }
    return obj;
  }, [customTunings]);

  // Build per-string meta from custom packs
  const customPresetMetaMap = useMemo(() => {
    if (!Array.isArray(customTunings) || !customTunings.length) return {};
    const obj = {};
    for (const p of customTunings) {
      const fromStrings = Array.isArray(p?.tuning?.strings)
        ? p.tuning.strings
            .map((s, idx) => {
              const m = {};
              if (typeof s?.startFret === "number") m.startFret = s.startFret;
              if (typeof s?.greyBefore === "boolean")
                m.greyBefore = s.greyBefore;
              return Object.keys(m).length ? { index: idx, ...m } : null;
            })
            .filter(Boolean)
        : [];
      const fromMeta = Array.isArray(p?.meta?.stringMeta)
        ? p.meta.stringMeta.filter((m) => m && typeof m.index === "number")
        : [];
      // merge by index (string-level fields take precedence over meta)
      const byIx = new Map(fromStrings.map((m) => [m.index, m]));
      for (const m of fromMeta) {
        const prev = byIx.get(m.index) || { index: m.index };
        byIx.set(m.index, { ...m, ...prev });
      }
      const merged = Array.from(byIx.values());
      if (merged.length) obj[p.name] = merged;
    }
    return obj;
  }, [customTunings]);

  // Merge maps (factory first, then customs)
  const mergedPresetMap = useMemo(
    () => ({ ...presetMap, ...customPresetMap }),
    [presetMap, customPresetMap],
  );

  const mergedPresetMetaMap = useMemo(
    () => ({ ...presetMetaMap, ...customPresetMetaMap }),
    [presetMetaMap, customPresetMetaMap],
  );

  // Names (avoid duplicate labels)
  const mergedPresetNames = useMemo(() => {
    const customNames = Object.keys(customPresetMap);
    const dedupCustom = customNames.filter((n) => !presetNames.includes(n));
    return [...presetNames, ...dedupCustom];
  }, [presetNames, customPresetMap]);

  // Selection state + applier
  const [selectedPreset, setSelectedPreset] = useState("Factory default");

  const setPreset = useCallback(
    (name) => {
      setSelectedPreset(name);

      const arr = mergedPresetMap[name];
      if (Array.isArray(arr) && arr.length) setTuning(arr);

      const meta = mergedPresetMetaMap?.[name] ?? null;
      setStringMeta(meta);
    },
    [mergedPresetMap, mergedPresetMetaMap, setTuning, setStringMeta],
  );

  const resetSelection = useCallback(() => {
    setSelectedPreset("Factory default");
  }, []);

  return {
    mergedPresetMap,
    mergedPresetMetaMap,
    mergedPresetNames,
    selectedPreset,
    setPreset,
    resetSelection,
  };
}
