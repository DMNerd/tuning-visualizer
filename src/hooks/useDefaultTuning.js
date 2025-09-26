import { useCallback, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";

function keyOf(systemId, strings) {
  return `${systemId}:${strings}`;
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_DEFAULT_TUNING);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(obj) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_DEFAULT_TUNING, JSON.stringify(obj));
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

export function useDefaultTuning({
  systemId,
  strings,
  DEFAULT_TUNINGS,
  PRESET_TUNINGS,
  PRESET_TUNING_META = {},
}) {
  const storeKey = keyOf(systemId, strings);

  // Memoize factory so callbacks/memos using it have stable deps
  const factory = useMemo(
    () => DEFAULT_TUNINGS?.[systemId]?.[strings] ?? [],
    [DEFAULT_TUNINGS, systemId, strings],
  );

  // Version to force re-reads of localStorage after writes
  const [storeVer, setStoreVer] = useState(0);

  // "Saved default" for the current (system, strings), live-retrieved.
  // Touch storeVer inside so ESLint is happy and the memo recomputes after saves.
  const saved = useMemo(() => {
    void storeVer; // intentional reference
    return readStore()[storeKey];
  }, [storeKey, storeVer]);

  const savedExists = !!saved && Array.isArray(saved) && saved.length > 0;

  // Preferred default = Saved (if exists) else Factory
  const getPreferredDefault = useCallback(() => {
    const fresh = readStore();
    const maybe = fresh[storeKey];
    return Array.isArray(maybe) && maybe.length ? maybe : factory;
  }, [storeKey, factory]);

  // Live tuning state initialized to preferred default
  const [tuning, setTuning] = useState(() => getPreferredDefault());

  // When instrument identity changes, reset tuning to preferred default
  useEffect(() => {
    setTuning(getPreferredDefault());
  }, [getPreferredDefault]);

  // Build preset map shown in UI
  const presetMap = useMemo(() => {
    const m = { "Factory default": factory };
    if (savedExists) m["Saved default"] = saved;

    const catalog = PRESET_TUNINGS?.[systemId]?.[strings] || {};
    for (const [name, arr] of Object.entries(catalog)) {
      if (!m[name]) m[name] = arr;
    }
    return m;
  }, [factory, savedExists, saved, systemId, strings, PRESET_TUNINGS]);

  // Build meta map for presets (optional metadata per preset)
  const presetMetaMap = useMemo(() => {
    const metaForGroup = PRESET_TUNING_META?.[systemId]?.[strings] || {};
    const out = Object.create(null);
    out["Factory default"] = null;
    if (presetMap["Saved default"]) out["Saved default"] = null;
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

  // Actions for saved default
  const saveDefault = useCallback(() => {
    const next = { ...readStore() };
    // If user is saving the factory default, just remove any saved default.
    const isFactory =
      Array.isArray(factory) &&
      tuning.length === factory.length &&
      tuning.every((v, i) => v === factory[i]);

    if (isFactory) {
      delete next[storeKey];
    } else {
      next[storeKey] = tuning;
    }

    writeStore(next);
    setStoreVer((v) => v + 1); // refresh savedExists/presetMap immediately
  }, [storeKey, tuning, factory]);

  const loadSavedDefault = useCallback(() => {
    const fresh = readStore();
    const maybe = fresh[storeKey];
    if (Array.isArray(maybe) && maybe.length) setTuning(maybe);
  }, [storeKey]);

  const resetFactoryDefault = useCallback(() => {
    setTuning(factory);
  }, [factory]);

  // For changing string count: also prefer a saved default for that count
  const defaultForCount = useCallback(
    (count) => {
      const fresh = readStore();
      const k = keyOf(systemId, count);
      const maybe = fresh[k];
      return Array.isArray(maybe) && maybe.length
        ? maybe
        : DEFAULT_TUNINGS[systemId][count];
    },
    [DEFAULT_TUNINGS, systemId],
  );

  return {
    tuning,
    setTuning,
    presetMap,
    presetMetaMap,
    getPresetMeta,
    presetNames: Object.keys(presetMap),
    savedExists,
    saveDefault,
    loadSavedDefault,
    resetFactoryDefault,
    defaultForCount,
  };
}

export default useDefaultTuning;
