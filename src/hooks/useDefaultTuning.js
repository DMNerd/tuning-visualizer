import { useCallback, useMemo } from "react";
import { useImmer } from "use-immer";
import {
  useLocalStorage,
  useUpdateEffect,
  usePreviousDistinct,
} from "react-use";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { isPlainObject } from "@/utils/object";
import { normalizePresetMeta } from "@/lib/meta/meta";

function keyOf(systemId, strings) {
  return `${systemId}:${strings}`;
}

function normalizeSavedEntry(raw) {
  if (Array.isArray(raw)) {
    return { tuning: raw, meta: null };
  }
  if (isPlainObject(raw)) {
    const tuning = Array.isArray(raw.tuning) ? raw.tuning : null;
    const meta = normalizePresetMeta(raw.meta, { stringMetaFormat: "array" });
    if (Array.isArray(tuning) && tuning.length) {
      return { tuning, meta };
    }
  }
  return { tuning: null, meta: null };
}

export function useDefaultTuning({
  systemId,
  strings,
  DEFAULT_TUNINGS,
  PRESET_TUNINGS,
  PRESET_TUNING_META = {},
}) {
  const storeKey = keyOf(systemId, strings);

  const [savedMap, setSavedMap] = useLocalStorage(
    STORAGE_KEYS.USER_DEFAULT_TUNING,
    {},
  );

  const savedEntry = useMemo(
    () => normalizeSavedEntry(savedMap?.[storeKey]),
    [savedMap, storeKey],
  );
  const saved = savedEntry.tuning;
  const savedMeta = savedEntry.meta;
  const savedExists = Array.isArray(saved) && saved.length > 0;

  const factory = useMemo(() => {
    const systemDefaults = DEFAULT_TUNINGS?.[systemId]?.[strings];
    if (Array.isArray(systemDefaults) && systemDefaults.length) {
      return systemDefaults;
    }

    if (savedExists) {
      return Array.isArray(saved) ? saved.slice() : [];
    }

    const twelveTetFallback = DEFAULT_TUNINGS?.["12-TET"]?.[strings];
    if (Array.isArray(twelveTetFallback) && twelveTetFallback.length) {
      return twelveTetFallback.slice();
    }

    return Array.isArray(saved) ? saved.slice() : [];
  }, [DEFAULT_TUNINGS, systemId, strings, savedExists, saved]);

  const getPreferredDefault = useCallback(() => {
    if (savedExists) {
      return Array.isArray(saved) ? saved.slice() : [];
    }
    return factory;
  }, [savedExists, saved, factory]);

  const [tuning, setTuning] = useImmer(() => getPreferredDefault());

  const systemStringsKey = `${systemId}|${strings}`;
  usePreviousDistinct(systemStringsKey);

  useUpdateEffect(() => {
    setTuning(getPreferredDefault());
  }, [getPreferredDefault, setTuning]);

  const presetMap = useMemo(() => {
    const m = { "Factory default": factory };
    if (savedExists) m["Saved default"] = saved.slice();

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
    if (presetMap["Saved default"]) {
      out["Saved default"] = savedMeta ? { ...savedMeta } : null;
    }

    for (const name of Object.keys(presetMap)) {
      if (name === "Factory default" || name === "Saved default") continue;
      out[name] = normalizePresetMeta(metaForGroup[name], {
        stringMetaFormat: "array",
      });
    }
    return out;
  }, [PRESET_TUNING_META, systemId, strings, presetMap, savedMeta]);

  const getPresetMeta = useCallback(
    (name) => (name in presetMetaMap ? presetMetaMap[name] : null),
    [presetMetaMap],
  );

  const saveDefault = useCallback(
    (stringMeta, boardMeta) => {
      const isFactory =
        Array.isArray(factory) &&
        tuning.length === factory.length &&
        tuning.every((v, i) => v === factory[i]);

      setSavedMap((prev) => {
        const next = { ...(prev || {}) };
        if (isFactory) delete next[storeKey];
        else {
          const metaInput = {
            ...(Array.isArray(stringMeta) && stringMeta.length
              ? { stringMeta }
              : {}),
            ...(isPlainObject(boardMeta) ? { board: boardMeta } : {}),
          };
          const meta = normalizePresetMeta(metaInput, {
            stringMetaFormat: "array",
          });
          next[storeKey] = {
            tuning: tuning.slice(),
            ...(meta ? { meta } : {}),
          };
        }
        return next;
      });
    },
    [factory, tuning, storeKey, setSavedMap],
  );

  const loadSavedDefault = useCallback(() => {
    if (Array.isArray(saved) && saved.length) {
      setTuning(saved.slice());
      return savedMeta || null;
    }
    return null;
  }, [saved, savedMeta, setTuning]);

  const resetFactoryDefault = useCallback(() => {
    setTuning(factory);
  }, [factory, setTuning]);

  const defaultForCount = useCallback(
    (count) => {
      const key = keyOf(systemId, count);
      const savedForCount = normalizeSavedEntry(savedMap?.[key]);
      if (Array.isArray(savedForCount.tuning) && savedForCount.tuning.length) {
        return savedForCount.tuning.slice();
      }

      const systemDefaults = DEFAULT_TUNINGS?.[systemId]?.[count];
      if (Array.isArray(systemDefaults) && systemDefaults.length) {
        return systemDefaults;
      }

      const fallbackDefaults = DEFAULT_TUNINGS?.["12-TET"]?.[count];
      if (Array.isArray(fallbackDefaults) && fallbackDefaults.length) {
        return fallbackDefaults.slice();
      }

      if (Array.isArray(tuning) && tuning.length === count) {
        return tuning.slice();
      }

      return [];
    },
    [DEFAULT_TUNINGS, systemId, savedMap, tuning],
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
