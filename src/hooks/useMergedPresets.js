import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { toStringMetaMap } from "@/lib/meta/meta";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizePresetMeta(meta) {
  if (Array.isArray(meta)) {
    return { stringMeta: meta };
  }
  if (isPlainObject(meta)) {
    const stringMeta = Array.isArray(meta.stringMeta) ? meta.stringMeta : null;
    const board = isPlainObject(meta.board) ? meta.board : null;
    if (stringMeta || board) {
      return {
        ...(stringMeta ? { stringMeta } : {}),
        ...(board ? { board } : {}),
      };
    }
  }
  return null;
}

export function useMergedPresets({
  presetMap,
  presetMetaMap,
  presetNames,
  customTunings,
  setTuning,
  setStringMeta,
  setBoardMeta,
  currentEdo,
  currentStrings,
  systemId,
  strings,
  savedExists,
  onInstrumentChange,
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

  // Build per-string and board meta from compatible customs
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
      const mergedStrings = Array.from(byIx.values());
      const boardMeta = isPlainObject(p?.meta?.board) ? p.meta.board : null;
      const normalized = normalizePresetMeta({
        stringMeta: mergedStrings.length ? mergedStrings : undefined,
        board: boardMeta || undefined,
      });
      if (normalized) obj[p.name] = normalized;
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

  const defaultPresetName = useMemo(() => {
    if (savedExists && mergedPresetNames.includes("Saved default")) {
      return "Saved default";
    }
    if (mergedPresetNames.includes("Factory default")) {
      return "Factory default";
    }
    return mergedPresetNames[0] ?? null;
  }, [savedExists, mergedPresetNames]);

  const setPreset = useCallback(
    (name) => {
      setSelectedPreset(name);

      const arr = mergedPresetMap[name];
      if (Array.isArray(arr) && arr.length) setTuning(arr);

      const meta = normalizePresetMeta(mergedPresetMetaMap?.[name]);
      if (meta?.stringMeta) setStringMeta(meta.stringMeta);
      else setStringMeta(null);
      if (meta?.board) setBoardMeta(meta.board);
      else setBoardMeta(null);
    },
    [
      mergedPresetMap,
      mergedPresetMetaMap,
      setTuning,
      setStringMeta,
      setBoardMeta,
    ],
  );

  const resetSelection = useCallback(() => {
    setSelectedPreset(defaultPresetName || "Factory default");
  }, [defaultPresetName]);

  const queuedPresetRef = useRef(null);

  const queuePresetByName = useCallback(
    (name) => {
      if (typeof name !== "string" || !name.trim()) {
        queuedPresetRef.current = null;
        return;
      }

      if (mergedPresetNames.includes(name) && mergedPresetMap[name]) {
        setPreset(name);
        queuedPresetRef.current = null;
        return;
      }

      queuedPresetRef.current = name;
    },
    [mergedPresetNames, mergedPresetMap, setPreset],
  );

  useEffect(() => {
    if (!selectedPreset) return;
    if (mergedPresetMap[selectedPreset]) {
      setPreset(selectedPreset);
    }
  }, [mergedPresetMap, selectedPreset, setPreset]);

  useEffect(() => {
    const pending = queuedPresetRef.current;
    if (!pending) return;
    if (mergedPresetNames.includes(pending) && mergedPresetMap[pending]) {
      setPreset(pending);
      queuedPresetRef.current = null;
    }
  }, [mergedPresetNames, mergedPresetMap, setPreset]);

  useEffect(() => {
    if (!defaultPresetName) return;
    queuePresetByName(defaultPresetName);
  }, [defaultPresetName, queuePresetByName]);

  useEffect(() => {
    if (systemId === undefined && strings === undefined && !onInstrumentChange)
      return;

    setStringMeta(null);
    setBoardMeta(null);

    if (typeof onInstrumentChange === "function") {
      onInstrumentChange({
        queuePresetByName,
        resetSelection,
        defaultPresetName,
      });
      return;
    }

    resetSelection();
    if (defaultPresetName) {
      queuePresetByName(defaultPresetName);
    }
  }, [
    systemId,
    strings,
    onInstrumentChange,
    queuePresetByName,
    resetSelection,
    defaultPresetName,
    setStringMeta,
    setBoardMeta,
  ]);

  return useMemo(
    () => ({
      mergedPresetMap,
      mergedPresetMetaMap,
      mergedPresetNames,
      customPresetNames,
      selectedPreset,
      setPreset,
      resetSelection,
      queuePresetByName,
    }),
    [
      mergedPresetMap,
      mergedPresetMetaMap,
      mergedPresetNames,
      customPresetNames,
      selectedPreset,
      setPreset,
      resetSelection,
      queuePresetByName,
    ],
  );
}
