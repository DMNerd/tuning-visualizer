import { useCallback, useMemo } from "react";
import { buildInstrumentControlModel } from "@/app/adapters/controls";
import { PANEL_CONTRACTS } from "@/app/contracts/panelContracts";
import { useCustomTuningPacks } from "@/hooks/useCustomTuningPacks";
import {
  useInstrumentCapoSlice,
  useInstrumentConfig,
  useInstrumentFretsSlice,
} from "@/hooks/useInstrumentConfig";
import { useMergedPresets } from "@/hooks/useMergedPresets";
import { useTuningIO } from "@/hooks/useTuningIO";
import { buildInstrumentDomainReturn } from "@/app/hooks/domainReturnBuilders";

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
    kgNeckFilterEnabled: instrumentState.kgNeckFilterEnabled,
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
    setKgNeckFilterEnabled,
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
        kgNeckFilterEnabled: instrumentState.kgNeckFilterEnabled,
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
        setKgNeckFilterEnabled,
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
      instrumentState.kgNeckFilterEnabled,
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
      setKgNeckFilterEnabled,
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
