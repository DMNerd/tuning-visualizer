import { useCallback, useMemo } from "react";
import { buildInstrumentControlModel } from "@shared/lib/controlModels";
import { PANEL_CONTRACTS } from "@shared/lib/panelContracts";
import { useCustomTuningPacks } from "@features/instrument/hooks/useCustomTuningPacks";
import {
  useInstrumentCapoSlice,
  useInstrumentConfig,
  useInstrumentFretsSlice,
} from "@features/instrument/hooks/useInstrumentConfig";
import { useMergedPresets } from "@features/instrument/hooks/useMergedPresets";
import { useTuningIO } from "@features/instrument/hooks/useTuningIO";
import { buildInstrumentDomainReturn } from "@shared/lib/domainReturnBuilders";

export function useInstrumentDomain({
  system,
  sysNames,
  systemId,
  setSystemId,
  tunings,
  stringsRange,
  fretsRange,
  factory,
  presetMeta,
  defaultTunings,
  presetTunings,
  confirm,
  noteNaming = "english",
}) {
  const instrument = useInstrumentConfig({
    system,
    systemId,
    stringsRange,
    fretsRange,
    factory,
    presetMeta,
    defaultTunings,
    presetTunings,
  });
  const capo = useInstrumentCapoSlice(instrument);
  const fretsSlice = useInstrumentFretsSlice(instrument);
  const instrumentState = instrument.state;
  const instrumentActions = instrument.actions;
  const instrumentDerived = instrument.derived;
  const instrumentPresets = instrument.presets;

  const customTunings = useTuningIO({
    systemId,
    strings: instrumentState.strings,
    TUNINGS: tunings,
  });

  const presets = useMergedPresets({
    presetMap: instrumentPresets.presetMap,
    presetMetaMap: instrumentPresets.presetMetaMap,
    customTunings: customTunings.customTunings,
    setTuning: instrumentActions.setTuning,
    setStringMeta: instrumentActions.setStringMeta,
    setBoardMeta: instrumentActions.setBoardMeta,
    currentEdo: system.divisions,
    currentStrings: instrumentState.strings,
    currentTuning: instrumentState.tuning,
    systemId,
    strings: instrumentState.strings,
    savedExists: instrumentDerived.savedExists,
    neckFilterMode: instrumentState.neckFilterMode,
    setNeckFilterMode: instrumentActions.setNeckFilterMode,
  });

  const customPackEditor = useCustomTuningPacks({
    confirm,
    getCurrentTuningPack: customTunings.getCurrentTuningPack,
    saveCustomTuning: customTunings.saveCustomTuning,
    deleteCustomTuning: customTunings.deleteCustomTuning,
    clearCustomTunings: customTunings.clearCustomTunings,
    tuning: instrumentState.tuning,
    stringMeta: instrumentState.stringMeta,
    boardMeta: instrumentState.boardMeta,
    customTunings: customTunings.customTunings,
    customPresetNames: presets.customPresetNames,
    selectedPreset: presets.selectedPreset,
    queuePresetByName: presets.queuePresetByName,
  });

  const { strings, frets, tuning } = instrumentState;
  const { divisions: systemDivisions } = system;
  const {
    setFretsPref,
    setTuning,
    handleStringsChange,
    handleSaveDefault,
    setNeckFilterMode,
  } = instrumentActions;
  const {
    mergedPresetNames,
    customPresetNames,
    mergedPresetMetaMap,
    selectedPreset,
    setPreset,
  } = presets;
  const { openCreate, openEditSelected } = customPackEditor;

  const sharedPayload = useMemo(
    () => ({
      instrument: {
        strings,
        frets,
        tuning,
        systemId,
        systemDivisions,
        sysNames,
        tunings,
        noteNaming,
        neckFilterMode: instrumentState.neckFilterMode,
      },
      presets: {
        mergedPresetNames,
        customPresetNames,
        mergedPresetMetaMap,
        selectedPreset,
        setPreset,
      },
      handlers: {
        setFretsPref,
        setSystemId,
        setTuning,
        handleStringsChange,
        handleSaveDefault,
        setNeckFilterMode,
        openCreate,
        openEditSelected,
      },
    }),
    [
      strings,
      frets,
      tuning,
      systemId,
      systemDivisions,
      sysNames,
      tunings,
      noteNaming,
      instrumentState.neckFilterMode,
      mergedPresetNames,
      customPresetNames,
      mergedPresetMetaMap,
      selectedPreset,
      setPreset,
      setFretsPref,
      setSystemId,
      setTuning,
      handleStringsChange,
      handleSaveDefault,
      setNeckFilterMode,
      openCreate,
      openEditSelected,
    ],
  );

  const buildInstrumentControlModelWithReset = useCallback(
    (resetInstrumentFactory) =>
      buildInstrumentControlModel({
        instrument: sharedPayload.instrument,
        presets: sharedPayload.presets,
        handlers: sharedPayload.handlers,
        reset: { resetInstrumentFactory },
      }),
    [sharedPayload],
  );

  const buildInstrumentPanel = useCallback(
    (resetInstrumentFactory) => ({
      contract: PANEL_CONTRACTS.instrument,
      state: sharedPayload.instrument,
      preset: sharedPayload.presets,
      handlers: sharedPayload.handlers,
      reset: { resetInstrumentFactory },
    }),
    [sharedPayload],
  );

  // Memoize construction, not passthrough references.

  const instrumentDomain = useMemo(
    () =>
      buildInstrumentDomainReturn({
        instrumentState,
        instrumentActions,
        instrumentDerived,
        fretsSlice,
        capo,
        presets,
        customTunings,
        customPackEditor,
        buildInstrumentPanel,
        buildInstrumentControlModelWithReset,
      }),
    [
      instrumentState,
      instrumentActions,
      instrumentDerived,
      fretsSlice,
      capo,
      presets,
      customTunings,
      customPackEditor,
      buildInstrumentPanel,
      buildInstrumentControlModelWithReset,
    ],
  );

  return instrumentDomain;
}
