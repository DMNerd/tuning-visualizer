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
    /* empty */
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

  const factory = useMemo(
    () => DEFAULT_TUNINGS?.[systemId]?.[strings] ?? [],
    [DEFAULT_TUNINGS, systemId, strings],
  );

  const [storeVer, setStoreVer] = useState(0);

  const saved = useMemo(() => {
    void storeVer;
    return readStore()[storeKey];
  }, [storeKey, storeVer]);

  const savedExists = !!saved && Array.isArray(saved) && saved.length > 0;

  const getPreferredDefault = useCallback(() => {
    const fresh = readStore();
    const maybe = fresh[storeKey];
    return Array.isArray(maybe) && maybe.length ? maybe : factory;
  }, [storeKey, factory]);

  const [tuning, setTuning] = useState(() => getPreferredDefault());

  useEffect(() => {
    setTuning(getPreferredDefault());
  }, [getPreferredDefault]);

  const presetMap = useMemo(() => {
    const m = { "Factory default": factory };
    if (savedExists) m["Saved default"] = saved;

    const catalog = PRESET_TUNINGS?.[systemId]?.[strings] || {};
    for (const [name, arr] of Object.entries(catalog)) {
      if (!m[name]) m[name] = arr;
    }
    return m;
  }, [factory, savedExists, saved, systemId, strings, PRESET_TUNINGS]);

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

  const saveDefault = useCallback(() => {
    const next = { ...readStore() };
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
    setStoreVer((v) => v + 1);
  }, [storeKey, tuning, factory]);

  const loadSavedDefault = useCallback(() => {
    const fresh = readStore();
    const maybe = fresh[storeKey];
    if (Array.isArray(maybe) && maybe.length) setTuning(maybe);
  }, [storeKey]);

  const resetFactoryDefault = useCallback(() => {
    setTuning(factory);
  }, [factory]);

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

  return useMemo(
    () => ({
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
    }),
    [
      tuning,
      setTuning,
      presetMap,
      presetMetaMap,
      getPresetMeta,
      savedExists,
      saveDefault,
      loadSavedDefault,
      resetFactoryDefault,
      defaultForCount,
    ],
  );
}
