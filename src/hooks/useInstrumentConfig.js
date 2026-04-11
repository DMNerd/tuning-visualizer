import { useCallback, useEffect, useMemo } from "react";
import { usePrevious } from "react-use";
import { useShallow } from "zustand/react/shallow";
import { useDrawFrets } from "@/hooks/useDrawFrets";
import { useCapo } from "@/hooks/useCapo";
import { useStringsChange } from "@/hooks/useStringsChange";
import { usePresetBuilder } from "@/hooks/usePresetBuilder";
import { normalizePresetMeta } from "@/lib/meta/meta";
import { isPlainObject } from "@/utils/object";
import {
  useInstrumentCoreStore,
  selectInstrumentCoreActions,
  selectInstrumentBoardMeta,
  selectInstrumentCoreIsHydrated,
  selectInstrumentDefaultTuningMap,
  selectNeckFilterMode,
  selectInstrumentFrets,
  selectInstrumentFretsTouched,
  selectInstrumentStringMeta,
  selectInstrumentStrings,
  selectInstrumentTuning,
} from "@/stores/useInstrumentCoreStore";

const selectInstrumentConfigStore = (state) => ({
  strings: selectInstrumentStrings(state),
  frets: selectInstrumentFrets(state),
  fretsTouched: selectInstrumentFretsTouched(state),
  isHydrated: selectInstrumentCoreIsHydrated(state),
  tuning: selectInstrumentTuning(state),
  stringMeta: selectInstrumentStringMeta(state),
  boardMeta: selectInstrumentBoardMeta(state),
  userDefaultTuningMap: selectInstrumentDefaultTuningMap(state),
  neckFilterMode: selectNeckFilterMode(state),
  ...selectInstrumentCoreActions(state),
});

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

export function useInstrumentConfig({
  system,
  systemId,
  stringsRange,
  fretsRange,
  presetMeta,
  defaultTunings,
  presetTunings,
}) {
  const instrumentStore = useInstrumentCoreStore(
    useShallow(selectInstrumentConfigStore),
  );
  const {
    strings,
    frets,
    fretsTouched,
    isHydrated,
    tuning,
    stringMeta,
    boardMeta,
    userDefaultTuningMap,
    neckFilterMode,
    setStrings,
    setFrets,
    setFretsUI,
    setTuning,
    setStringMeta,
    setBoardMeta,
    setNeckFilterMode,
    updateUserDefaultTuningMap,
    resetInstrumentPrefs,
  } = instrumentStore;

  const minStrings = stringsRange.min;
  const maxStrings = stringsRange.max;
  const minFrets = fretsRange.min;
  const maxFrets = fretsRange.max;

  useEffect(() => {
    if (strings < minStrings || strings > maxStrings) {
      setStrings(Math.max(minStrings, Math.min(maxStrings, strings)));
    }
  }, [strings, minStrings, maxStrings, setStrings]);

  useEffect(() => {
    if (frets < minFrets || frets > maxFrets) {
      setFrets(Math.max(minFrets, Math.min(maxFrets, frets)));
    }
  }, [frets, minFrets, maxFrets, setFrets]);

  const storeKey = keyOf(systemId, strings);
  const savedEntry = useMemo(
    () => normalizeSavedEntry(userDefaultTuningMap?.[storeKey]),
    [userDefaultTuningMap, storeKey],
  );
  const saved = savedEntry.tuning;
  const savedMeta = savedEntry.meta;
  const savedExists = Array.isArray(saved) && saved.length > 0;

  const factoryDefault = useMemo(() => {
    const systemDefaults = defaultTunings?.[systemId]?.[strings];
    if (Array.isArray(systemDefaults) && systemDefaults.length) {
      return systemDefaults;
    }

    if (savedExists) {
      return Array.isArray(saved) ? saved.slice() : [];
    }

    const twelveTetFallback = defaultTunings?.["12-TET"]?.[strings];
    if (Array.isArray(twelveTetFallback) && twelveTetFallback.length) {
      return twelveTetFallback.slice();
    }

    return Array.isArray(saved) ? saved.slice() : [];
  }, [defaultTunings, systemId, strings, savedExists, saved]);

  const getPreferredDefault = useCallback(() => {
    if (savedExists) return Array.isArray(saved) ? saved.slice() : [];
    return factoryDefault;
  }, [savedExists, saved, factoryDefault]);

  const prevSystemStringsKey = usePrevious(`${systemId}|${strings}`);
  useEffect(() => {
    if (prevSystemStringsKey === undefined) {
      if (!Array.isArray(tuning) || tuning.length === 0) {
        setTuning(getPreferredDefault());
      }
      return;
    }

    if (prevSystemStringsKey !== `${systemId}|${strings}`) {
      setTuning(getPreferredDefault());
    }
  }, [
    prevSystemStringsKey,
    systemId,
    strings,
    tuning,
    setTuning,
    getPreferredDefault,
  ]);

  const { presetMap, presetMetaMap } = usePresetBuilder({
    factory: factoryDefault,
    saved: savedExists ? saved.slice() : null,
    savedMeta,
    catalogPresets: presetTunings?.[systemId]?.[strings] || {},
    catalogMeta: presetMeta?.[systemId]?.[strings] || {},
    stringMetaFormat: "array",
  });

  const saveDefault = useCallback(
    (nextStringMeta, nextBoardMeta) => {
      const isFactory =
        Array.isArray(factoryDefault) &&
        tuning.length === factoryDefault.length &&
        tuning.every((value, index) => value === factoryDefault[index]);

      updateUserDefaultTuningMap((next) => {
        if (isFactory) {
          delete next[storeKey];
          return;
        }

        const metaInput = {
          ...(Array.isArray(nextStringMeta) && nextStringMeta.length
            ? { stringMeta: nextStringMeta }
            : {}),
          ...(isPlainObject(nextBoardMeta) ? { board: nextBoardMeta } : {}),
        };
        const normalizedMeta = normalizePresetMeta(metaInput, {
          stringMetaFormat: "array",
        });

        next[storeKey] = {
          tuning: Array.isArray(tuning) ? tuning.slice() : [],
          ...(normalizedMeta ? { meta: normalizedMeta } : {}),
        };
      });
    },
    [factoryDefault, tuning, updateUserDefaultTuningMap, storeKey],
  );

  const handleSaveDefault = useCallback(() => {
    saveDefault(stringMeta, boardMeta);
  }, [boardMeta, saveDefault, stringMeta]);

  const defaultForCount = useCallback(
    (count) => {
      const key = keyOf(systemId, count);
      const savedForCount = normalizeSavedEntry(userDefaultTuningMap?.[key]);
      if (Array.isArray(savedForCount.tuning) && savedForCount.tuning.length) {
        return savedForCount.tuning.slice();
      }

      const systemDefaults = defaultTunings?.[systemId]?.[count];
      if (Array.isArray(systemDefaults) && systemDefaults.length) {
        return systemDefaults;
      }

      const fallbackDefaults = defaultTunings?.["12-TET"]?.[count];
      if (Array.isArray(fallbackDefaults) && fallbackDefaults.length) {
        return fallbackDefaults.slice();
      }

      if (Array.isArray(tuning) && tuning.length === count) {
        return tuning.slice();
      }

      return [];
    },
    [defaultTunings, systemId, userDefaultTuningMap, tuning],
  );

  const handleStringsChange = useStringsChange({
    setStrings,
    setTuning,
    defaultForCount,
  });

  const drawFrets = useDrawFrets({
    baseFrets: frets,
    divisions: system.divisions,
    fretsTouched,
    setFretsRaw: setFrets,
  });

  const capo = useCapo({
    strings,
    stringMeta,
  });

  const state = useMemo(
    () => ({
      strings,
      frets,
      isHydrated,
      tuning,
      stringMeta,
      boardMeta,
      neckFilterMode,
    }),
    [strings, frets, isHydrated, tuning, stringMeta, boardMeta, neckFilterMode],
  );
  const actions = useMemo(
    () => ({
      setStrings,
      setFrets,
      setFretsUI,
      setTuning,
      setStringMeta,
      setBoardMeta,
      setNeckFilterMode,
      resetInstrumentPrefs,
      setFretsPref: setFretsUI,
      handleSaveDefault,
      handleStringsChange,
    }),
    [
      setStrings,
      setFrets,
      setFretsUI,
      setTuning,
      setStringMeta,
      setBoardMeta,
      setNeckFilterMode,
      resetInstrumentPrefs,
      handleSaveDefault,
      handleStringsChange,
    ],
  );
  const derived = useMemo(
    () => ({ drawFrets, fretsTouched, savedExists, defaultForCount }),
    [drawFrets, fretsTouched, savedExists, defaultForCount],
  );
  const presets = useMemo(
    () => ({ presetMap, presetMetaMap }),
    [presetMap, presetMetaMap],
  );

  return {
    state,
    actions,
    derived,
    presets,
    capo,
  };
}

export function useInstrumentCapoSlice(instrumentConfig) {
  return instrumentConfig.capo;
}

export function useInstrumentFretsSlice(instrumentConfig) {
  const { state, actions, derived } = instrumentConfig;
  return useMemo(
    () => ({
      strings: state.strings,
      frets: state.frets,
      drawFrets: derived.drawFrets,
      setFretsUI: actions.setFretsUI,
      setFretsPref: actions.setFretsPref,
      handleStringsChange: actions.handleStringsChange,
    }),
    [
      state.strings,
      state.frets,
      derived.drawFrets,
      actions.setFretsUI,
      actions.setFretsPref,
      actions.handleStringsChange,
    ],
  );
}
