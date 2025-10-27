import { useMemo, useState, useCallback, useEffect } from "react";
import { toStringMetaMap } from "@/lib/meta/meta";

export function useMergedPresets({
  presetMap,
  presetMetaMap,
  presetNames,
  customTunings,
  setTuning,
  setStringMeta,
  currentEdo,
  currentStrings,
}) {
  const compatibleCustoms = useMemo(() => {
    if (!Array.isArray(customTunings)) return [];
    const edoNum = Number(currentEdo);
    const strNum = Number(currentStrings);
    return customTunings.filter((p) => {
      const edoOk = Number(p?.system?.edo) === edoNum;
      const arr = Array.isArray(p?.tuning?.strings) ? p.tuning.strings : null;
      const stringsOk = Array.isArray(arr) && arr.length === strNum;
      return edoOk && stringsOk;
    });
  }, [customTunings, currentEdo, currentStrings]);

  // Build map of tuning arrays from compatible customs
  const customPresetMap = useMemo(() => {
    if (!compatibleCustoms.length) return {};
    const obj = {};
    for (const p of compatibleCustoms) {
      const arr = Array.isArray(p?.tuning?.strings)
        ? p.tuning.strings.map((s) =>
            typeof s?.note === "string" ? s.note : "C",
          )
        : null;
      if (arr && arr.length) obj[p.name] = arr;
    }
    return obj;
  }, [compatibleCustoms]);

  // Build per-string meta from compatible customs
  const customPresetMetaMap = useMemo(() => {
    if (!compatibleCustoms.length) return {};
    const obj = {};
    for (const p of compatibleCustoms) {
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
      const byIx = toStringMetaMap(fromStrings);
      for (const m of fromMeta) {
        const prev = byIx.get(m.index) || { index: m.index };
        byIx.set(m.index, { ...m, ...prev });
      }
      const merged = Array.from(byIx.values());
      if (merged.length) obj[p.name] = merged;
    }
    return obj;
  }, [compatibleCustoms]);

  // Merge factory + customs
  const mergedPresetMap = useMemo(
    () => ({ ...presetMap, ...customPresetMap }),
    [presetMap, customPresetMap],
  );

  const mergedPresetMetaMap = useMemo(
    () => ({ ...presetMetaMap, ...customPresetMetaMap }),
    [presetMetaMap, customPresetMetaMap],
  );

  // Names (avoid duplicates)
  const customPresetNames = useMemo(
    () => Object.keys(customPresetMap),
    [customPresetMap],
  );

  const mergedPresetNames = useMemo(() => {
    const dedupCustom = customPresetNames.filter(
      (n) => !presetNames.includes(n),
    );
    return [...presetNames, ...dedupCustom];
  }, [presetNames, customPresetNames]);

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

  useEffect(() => {
    if (!selectedPreset) return;
    if (mergedPresetMap[selectedPreset]) {
      setPreset(selectedPreset);
    }
  }, [mergedPresetMap, selectedPreset, setPreset]);

  return useMemo(
    () => ({
      mergedPresetMap,
      mergedPresetMetaMap,
      mergedPresetNames,
      customPresetNames,
      selectedPreset,
      setPreset,
      resetSelection,
    }),
    [
      mergedPresetMap,
      mergedPresetMetaMap,
      mergedPresetNames,
      customPresetNames,
      selectedPreset,
      setPreset,
      resetSelection,
    ],
  );
}
