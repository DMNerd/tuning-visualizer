import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  usePrevious,
  useUpdateEffect,
  useLatest,
  useMountedState,
} from "react-use";
import { normalizePresetMeta } from "@/lib/meta/meta";
import { isPlainObject } from "@/utils/object";

function coerceTuningArray(strings) {
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

function coerceAnyTuning(value) {
  if (Array.isArray(value)) return coerceTuningArray(value);
  if (isPlainObject(value)) {
    return coerceTuningArray(value?.tuning?.strings);
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
  const isMounted = useMountedState();
  const onInstrumentChangeRef = useLatest(onInstrumentChange);

  const compatibleCustoms = useMemo(() => {
    if (!Array.isArray(customTunings) || !customTunings.length) return [];
    const edo = Number(currentEdo);
    const sc = Number(currentStrings);
    return customTunings.filter((t) => {
      if (!isPlainObject(t) || !Array.isArray(t?.tuning?.strings)) {
        return false;
      }

      const tEdo = Number(t?.system?.edo);
      const tStrings = t.tuning.strings.length;
      const stringsMatch =
        Number.isFinite(sc) && Number.isFinite(tStrings)
          ? tStrings === sc
          : true;
      const edoMatch =
        Number.isFinite(edo) && Number.isFinite(tEdo) ? tEdo === edo : true;
      return stringsMatch && edoMatch;
    });
  }, [customTunings, currentEdo, currentStrings]);

  const customPresetNames = useMemo(
    () =>
      compatibleCustoms
        .map((c) => (typeof c?.name === "string" ? c.name : null))
        .filter(Boolean),
    [compatibleCustoms],
  );

  const customPresetMap = useMemo(() => {
    if (!compatibleCustoms.length) return {};
    const out = {};
    for (const pack of compatibleCustoms) {
      const name = typeof pack?.name === "string" ? pack.name : null;
      const arr = coerceAnyTuning(pack);
      if (!name || !arr?.length) continue;
      out[name] = arr;
    }
    return out;
  }, [compatibleCustoms]);

  const customPresetMetaMap = useMemo(() => {
    if (!compatibleCustoms.length) return {};
    const out = {};
    for (const pack of compatibleCustoms) {
      const name = typeof pack?.name === "string" ? pack.name : null;
      const meta = normalizePresetMeta(pack?.meta, { stringMetaFormat: "map" });
      if (!name || !meta) continue;
      out[name] = meta;
    }
    return out;
  }, [compatibleCustoms]);

  const mergedPresetMap = useMemo(
    () => ({ ...presetMap, ...customPresetMap }),
    [presetMap, customPresetMap],
  );

  const mergedPresetMetaMap = useMemo(() => {
    const merged = { ...presetMetaMap };
    for (const [k, v] of Object.entries(customPresetMetaMap)) {
      merged[k] = v;
    }
    return merged;
  }, [presetMetaMap, customPresetMetaMap]);

  const mergedPresetNames = useMemo(() => {
    const names = new Set([
      ...(Array.isArray(presetNames) ? presetNames : []),
      ...customPresetNames,
    ]);
    const sc = Number(currentStrings);
    return Array.from(names).filter((name) => {
      const arr = coerceAnyTuning(mergedPresetMap?.[name]);
      if (!Number.isFinite(sc)) return true;
      return Array.isArray(arr) ? arr.length === sc : false;
    });
  }, [presetNames, customPresetNames, mergedPresetMap, currentStrings]);

  const defaultPresetName = useMemo(
    () => (savedExists ? "Saved default" : "Factory default"),
    [savedExists],
  );

  const [selectedPreset, setSelectedPreset] = useState(
    defaultPresetName || "Factory default",
  );

  const queuedPresetRef = useRef(null);

  const resolveTuningByName = useCallback(
    (name) => {
      if (!name) return null;
      const fromMerged = coerceAnyTuning(mergedPresetMap?.[name]);
      if (fromMerged?.length) return fromMerged;
      const fromPack = Array.isArray(compatibleCustoms)
        ? compatibleCustoms.find((p) => p?.name === name)
        : null;
      if (!fromPack) return null;
      return coerceAnyTuning(fromPack);
    },
    [mergedPresetMap, compatibleCustoms],
  );

  const setPreset = useCallback(
    (name) => {
      if (typeof name !== "string" || !name) return;
      if (!isMounted()) return;
      setSelectedPreset(name);
      const coerced = resolveTuningByName(name);
      if (!coerced?.length) {
        queuedPresetRef.current = name;
        return;
      }
      if (
        Array.isArray(coerced) &&
        Number.isFinite(currentStrings) &&
        coerced.length !== currentStrings
      ) {
        return;
      }
      setTuning(coerced);
      const meta =
        normalizePresetMeta(mergedPresetMetaMap?.[name]) ||
        normalizePresetMeta(
          (compatibleCustoms.find((p) => p?.name === name) || {})?.meta,
        );
      if (meta?.stringMeta) setStringMeta(meta.stringMeta);
      else setStringMeta(null);
      if (meta?.board) setBoardMeta(meta.board);
      else setBoardMeta(null);
      queuedPresetRef.current = null;
    },
    [
      isMounted,
      resolveTuningByName,
      mergedPresetMetaMap,
      compatibleCustoms,
      setTuning,
      setStringMeta,
      setBoardMeta,
      currentStrings,
    ],
  );

  const resetSelection = useCallback(() => {
    setSelectedPreset(defaultPresetName || "Factory default");
  }, [defaultPresetName]);

  const queuePresetByName = useCallback(
    (name) => {
      if (typeof name !== "string" || !name) return;
      const resolved = resolveTuningByName(name);
      if (resolved?.length) {
        setPreset(name);
        return;
      }
      queuedPresetRef.current = name;
    },
    [resolveTuningByName, setPreset],
  );

  useEffect(() => {
    if (!selectedPreset) return;
    const resolved = resolveTuningByName(selectedPreset);
    if (resolved?.length) {
      setPreset(selectedPreset);
    }
  }, [mergedPresetMap, resolveTuningByName, selectedPreset, setPreset]);

  useUpdateEffect(() => {
    if (!selectedPreset) return;
    const resolved = resolveTuningByName(selectedPreset);
    if (resolved?.length) {
      setPreset(selectedPreset);
    }
  }, [mergedPresetMap, selectedPreset, resolveTuningByName, setPreset]);

  useUpdateEffect(() => {
    if (!selectedPreset) return;
    if (mergedPresetNames.includes(selectedPreset)) return;

    resetSelection();

    if (defaultPresetName && mergedPresetNames.includes(defaultPresetName)) {
      queuePresetByName(defaultPresetName);
      return;
    }

    const fallback = mergedPresetNames[0];
    if (fallback) {
      queuePresetByName(fallback);
    }
  }, [
    mergedPresetNames,
    selectedPreset,
    defaultPresetName,
    resetSelection,
    queuePresetByName,
  ]);

  useUpdateEffect(() => {
    const pending = queuedPresetRef.current;
    if (!pending) return;
    const resolved = resolveTuningByName(pending);
    if (resolved?.length) {
      setPreset(pending);
      queuedPresetRef.current = null;
    }
  }, [mergedPresetNames, mergedPresetMap, resolveTuningByName, setPreset]);

  const prevSystemId = usePrevious(systemId);
  const prevStrings = usePrevious(strings);

  useUpdateEffect(() => {
    const instrumentChanged =
      prevSystemId !== systemId || prevStrings !== strings;
    if (!instrumentChanged) return;
    setStringMeta(null);
    setBoardMeta(null);
    if (typeof onInstrumentChangeRef.current === "function") {
      onInstrumentChangeRef.current({
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
    prevSystemId,
    prevStrings,
    queuePresetByName,
    resetSelection,
    defaultPresetName,
    setStringMeta,
    setBoardMeta,
    onInstrumentChangeRef,
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
