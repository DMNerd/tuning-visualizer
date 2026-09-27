import { useCallback, useEffect, useMemo } from "react";
import { usePrevious } from "react-use";
import { useShallow } from "zustand/react/shallow";
import { useTuningWasSetAtomically } from "@features/instrument/hooks/useTuningAtomicEpoch";
import { useDrawFrets } from "@features/instrument/hooks/useDrawFrets";
import { useCapo } from "@features/instrument/hooks/useCapo";
import { useStringsChange } from "@features/instrument/hooks/useStringsChange";
import { usePresetBuilder } from "@features/instrument/hooks/usePresetBuilder";
import {
  buildSavedDefaultEntry,
  defaultTuningKey,
  isSameTuning,
  normalizeSavedEntry,
  resolveDefaultForCount,
  resolveFactoryDefault,
} from "@features/instrument/model/defaultTunings";
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
  selectInstrumentTuningAtomicEpoch,
} from "@features/instrument/store/useInstrumentCoreStore";

const selectInstrumentConfigStore = (state) => ({
  strings: selectInstrumentStrings(state),
  frets: selectInstrumentFrets(state),
  fretsTouched: selectInstrumentFretsTouched(state),
  isHydrated: selectInstrumentCoreIsHydrated(state),
  tuning: selectInstrumentTuning(state),
  tuningAtomicEpoch: selectInstrumentTuningAtomicEpoch(state),
  stringMeta: selectInstrumentStringMeta(state),
  boardMeta: selectInstrumentBoardMeta(state),
  userDefaultTuningMap: selectInstrumentDefaultTuningMap(state),
  neckFilterMode: selectNeckFilterMode(state),
  ...selectInstrumentCoreActions(state),
});

export function useInstrumentConfig({
  system,
  systemId,
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
    tuningAtomicEpoch,
    stringMeta,
    boardMeta,
    userDefaultTuningMap,
    neckFilterMode,
    setStrings,
    setFrets,
    setFretsUI,
    setTuning,
    setTuningAtomic,
    setStringMeta,
    setBoardMeta,
    setNeckFilterMode,
    updateUserDefaultTuningMap,
    resetInstrumentPrefs,
  } = instrumentStore;

  const storeKey = defaultTuningKey(systemId, strings);
  const savedEntry = useMemo(
    () => normalizeSavedEntry(userDefaultTuningMap?.[storeKey]),
    [userDefaultTuningMap, storeKey],
  );
  const saved = savedEntry.tuning;
  const savedMeta = savedEntry.meta;
  const savedExists = Array.isArray(saved) && saved.length > 0;

  const factoryDefault = useMemo(
    () => resolveFactoryDefault(defaultTunings, systemId, strings, saved),
    [defaultTunings, systemId, strings, saved],
  );

  const getPreferredDefault = useCallback(() => {
    if (savedExists) return Array.isArray(saved) ? saved.slice() : [];
    return factoryDefault;
  }, [savedExists, saved, factoryDefault]);

  const prevSystemStringsKey = usePrevious(`${systemId}|${strings}`);
  const tuningWasSetAtomically = useTuningWasSetAtomically(tuningAtomicEpoch);
  useEffect(() => {
    if (prevSystemStringsKey === undefined) {
      if (!Array.isArray(tuning) || tuning.length === 0) {
        setTuning(getPreferredDefault());
      }
      return;
    }

    if (prevSystemStringsKey !== `${systemId}|${strings}`) {
      // Skip the auto-default if the tuning was *also* explicitly set
      // atomically alongside this system/strings change via
      // setTuningAtomic (e.g. applyResolvedTuning applying a specific
      // preset) — only fall back to the default otherwise.
      if (!tuningWasSetAtomically) {
        setTuning(getPreferredDefault());
      }
    }
  }, [
    prevSystemStringsKey,
    tuningWasSetAtomically,
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
      const isFactory = isSameTuning(tuning, factoryDefault);
      updateUserDefaultTuningMap((next) => {
        if (isFactory) {
          delete next[storeKey];
          return;
        }
        next[storeKey] = buildSavedDefaultEntry(
          tuning,
          nextStringMeta,
          nextBoardMeta,
        );
      });
    },
    [factoryDefault, tuning, updateUserDefaultTuningMap, storeKey],
  );

  const handleSaveDefault = useCallback(() => {
    saveDefault(stringMeta, boardMeta);
  }, [boardMeta, saveDefault, stringMeta]);

  const defaultForCount = useCallback(
    (count) =>
      resolveDefaultForCount({
        userDefaultTuningMap,
        defaultTunings,
        systemId,
        count,
        tuning,
      }),
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
      tuningAtomicEpoch,
      stringMeta,
      boardMeta,
      neckFilterMode,
    }),
    [
      strings,
      frets,
      isHydrated,
      tuning,
      tuningAtomicEpoch,
      stringMeta,
      boardMeta,
      neckFilterMode,
    ],
  );
  const actions = useMemo(
    () => ({
      setStrings,
      setFrets,
      setFretsUI,
      setTuning,
      setTuningAtomic,
      setStringMeta,
      setBoardMeta,
      setNeckFilterMode,
      resetInstrumentPrefs,
      handleSaveDefault,
      handleStringsChange,
    }),
    [
      setStrings,
      setFrets,
      setFretsUI,
      setTuning,
      setTuningAtomic,
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

export function getInstrumentCapoSlice(instrumentConfig) {
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
      handleStringsChange: actions.handleStringsChange,
    }),
    [
      state.strings,
      state.frets,
      derived.drawFrets,
      actions.setFretsUI,
      actions.handleStringsChange,
    ],
  );
}
