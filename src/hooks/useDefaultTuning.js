// hooks/useDefaultTuning.js
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Props:
 * - systemId: "12-TET" | "24-TET"
 * - strings: 4|5|6|7|8
 * - DEFAULT_TUNINGS: derived from presets (factory defaults)
 * - PRESET_TUNINGS: full catalog of named presets
 * - PRESET_TUNING_META (optional): parallel catalog with per-preset per-string metadata
 *
 * Returns:
 * - tuning, setTuning
 * - presetMap: { "Factory default": [...], "Saved default"?: [...], ...all named presets }
 * - presetMetaMap: { "Factory default": null, "Saved default"?: null, "<preset>": meta[] | null }
 * - getPresetMeta(name): () => meta[] | null
 * - presetNames
 * - savedExists, saveDefault(), loadSavedDefault(), resetFactoryDefault()
 * - defaultForCount(count)
 */

const STORAGE_KEY = "tv.user-default-tuning";

function keyOf(systemId, strings) {
  return `${systemId}:${strings}`;
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // ignore (private mode, quota, etc.)
  }
}

export function useDefaultTuning({
  systemId,
  strings,
  DEFAULT_TUNINGS,
  PRESET_TUNINGS,
  PRESET_TUNING_META = {}, // ← NEW, optional
}) {
  // Factory default for current (system, strings)
  const factory = DEFAULT_TUNINGS[systemId][strings];

  // Live tuning state
  const [tuning, setTuning] = useState(factory);

  // Any saved user default?
  const store = useMemo(() => readStore(), []);
  const storeKey = keyOf(systemId, strings);
  const saved = store[storeKey];
  const savedExists = !!saved && Array.isArray(saved) && saved.length > 0;

  // When system or strings change, reset the live tuning to factory
  useEffect(() => {
    setTuning(factory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemId, strings, factory.join("|")]);

  // Build preset map (names -> tuning array)
  const presetMap = useMemo(() => {
    const m = { "Factory default": factory };

    if (savedExists) m["Saved default"] = saved;

    const catalog = PRESET_TUNINGS?.[systemId]?.[strings] || {};
    for (const [name, arr] of Object.entries(catalog)) {
      if (!m[name]) m[name] = arr;
    }
    return m;
  }, [factory, savedExists, saved, systemId, strings, PRESET_TUNINGS]);

  // Build meta map (names -> meta[] | null)
  // Defaults to null when not defined (so callers can just pass it through).
  const presetMetaMap = useMemo(() => {
    const metaForGroup = PRESET_TUNING_META?.[systemId]?.[strings] || {};
    const out = Object.create(null);

    // Always include "Factory default" and "Saved default" with null meta
    out["Factory default"] = null;
    if (presetMap["Saved default"]) out["Saved default"] = null;

    // For every preset name we expose, attach meta if present; otherwise null
    for (const name of Object.keys(presetMap)) {
      if (name === "Factory default" || name === "Saved default") continue;
      const meta = metaForGroup[name];
      out[name] = Array.isArray(meta) ? meta : null;
    }
    return out;
  }, [PRESET_TUNING_META, systemId, strings, presetMap]);

  const getPresetMeta = useCallback(
    (name) => (name in presetMetaMap ? presetMetaMap[name] : null),
    [presetMetaMap],
  );

  const presetNames = useMemo(() => Object.keys(presetMap), [presetMap]);

  // Saved default actions
  const saveDefault = useCallback(() => {
    const next = { ...readStore(), [storeKey]: tuning };
    writeStore(next);
  }, [storeKey, tuning]);

  const loadSavedDefault = useCallback(() => {
    if (savedExists && saved) setTuning(saved);
  }, [savedExists, saved]);

  const resetFactoryDefault = useCallback(() => {
    setTuning(factory);
  }, [factory]);

  // For strings-change logic
  const defaultForCount = useCallback(
    (count) => DEFAULT_TUNINGS[systemId][count],
    [DEFAULT_TUNINGS, systemId],
  );

  return {
    tuning,
    setTuning,
    presetMap,
    presetMetaMap, // ← NEW
    getPresetMeta, // ← NEW
    presetNames,
    savedExists,
    saveDefault,
    loadSavedDefault,
    resetFactoryDefault,
    defaultForCount,
  };
}

export default useDefaultTuning;
