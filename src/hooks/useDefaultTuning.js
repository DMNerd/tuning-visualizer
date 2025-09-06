// hooks/useDefaultTuning.js
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Props:
 * - systemId: "12-TET" | "24-TET"
 * - strings: 4|5|6|7|8
 * - DEFAULT_TUNINGS: derived from presets (factory defaults)
 * - PRESET_TUNINGS: full catalog of named presets
 *
 * Returns:
 * - tuning, setTuning
 * - presetMap: { "Factory default": [...], "Saved default"?: [...], ...all named presets }
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

  // Build preset map:
  // - Always include "Factory default"
  // - Include "Saved default" if present
  // - Include all named presets for this (system, strings)
  const presetMap = useMemo(() => {
    const m = { "Factory default": factory };

    if (savedExists) m["Saved default"] = saved;

    const catalog = PRESET_TUNINGS?.[systemId]?.[strings] || {};
    for (const [name, arr] of Object.entries(catalog)) {
      // Avoid accidental overwrite (different name space anyway)
      if (!m[name]) m[name] = arr;
    }
    return m;
  }, [factory, savedExists, saved, systemId, strings, PRESET_TUNINGS]);

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
    presetNames,
    savedExists,
    saveDefault,
    loadSavedDefault,
    resetFactoryDefault,
    defaultForCount,
  };
}

export default useDefaultTuning;
