import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  usePrevious,
  useUpdateEffect,
  useLatest,
  useMountedState,
} from "react-use";
import { toStringMetaMap } from "@/lib/meta/meta";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function flattenOnce(arr) {
  if (!Array.isArray(arr)) return arr;
  let flat = [];
  let nested = false;
  for (const v of arr) {
    if (Array.isArray(v)) {
      nested = true;
      flat.push(...v);
    } else {
      flat.push(v);
    }
  }
  return nested ? flat : arr;
}

function coerceTuningArray(arr) {
  const a = flattenOnce(arr);
  if (!Array.isArray(a)) return null;
  const out = a
    .map((v) => {
      if (typeof v === "string") return v.trim();
      if (typeof v === "number" && Number.isFinite(v)) return String(v);
      if (isPlainObject(v)) {
        if (typeof v.token === "string") return v.token;
        if (typeof v.note === "string") return v.note;
        if (typeof v.pitch === "string") return v.pitch;
        if (typeof v.value === "string") return v.value;
      }
      return null;
    })
    .filter(Boolean);
  return out.length ? out : null;
}

function pickFirstArray(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (Array.isArray(v)) return v;
  }
  return null;
}

function coerceAnyTuning(input) {
  if (!input) return null;
  if (Array.isArray(input)) return coerceTuningArray(input);
  if (isPlainObject(input)) {
    const direct = pickFirstArray(input, [
      "tuning",
      "strings",
      "notes",
      "tokens",
      "pitches",
      "values",
    ]);
    if (direct) return coerceTuningArray(direct);
    const nested = pickFirstArray(input, ["data", "payload"]);
    if (nested) return coerceTuningArray(nested);
  }
  return null;
}

function normalizePresetMeta(meta) {
  if (!meta) return null;
  if (Array.isArray(meta)) {
    const mapped = toStringMetaMap(meta);
    return mapped ? { stringMeta: mapped } : null;
  }
  if (isPlainObject(meta)) {
    let stringMeta = null;
    if (Array.isArray(meta.stringMeta)) {
      stringMeta = toStringMetaMap(meta.stringMeta) || null;
    } else if (isPlainObject(meta.stringMeta)) {
      stringMeta = meta.stringMeta;
    }
    const board = isPlainObject(meta.board) ? meta.board : null;
    if (stringMeta || board) {
      return { stringMeta, board };
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
  const isMounted = useMountedState();
  const onInstrumentChangeRef = useLatest(onInstrumentChange);

  const compatibleCustoms = useMemo(() => {
    if (!Array.isArray(customTunings) || !customTunings.length) return [];
    const edo = Number(currentEdo);
    const sc = Number(currentStrings);
    return customTunings.filter((t) => {
      const tEdo = Number(t?.system?.edo ?? t?.edo);
      const tStrings = Array.isArray(t?.tuning)
        ? t.tuning.length
        : Array.isArray(t?.strings)
          ? t.strings.length
          : null;
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
      const arr =
        coerceAnyTuning(pack?.tuning) ||
        coerceAnyTuning(pack?.strings) ||
        coerceAnyTuning(pack);
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
      const meta = normalizePresetMeta(pack?.meta);
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
    return Array.from(names);
  }, [presetNames, customPresetNames]);

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
      return (
        coerceAnyTuning(fromPack?.tuning) ||
        coerceAnyTuning(fromPack?.strings) ||
        coerceAnyTuning(fromPack)
      );
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
  }, [mergedPresetMap, selectedPreset]);

  useUpdateEffect(() => {
    const pending = queuedPresetRef.current;
    if (!pending) return;
    const resolved = resolveTuningByName(pending);
    if (resolved?.length) {
      setPreset(pending);
      queuedPresetRef.current = null;
    }
  }, [mergedPresetNames, mergedPresetMap]);

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
