export function buildInstrumentControlModel({
  instrument,
  presets,
  handlers,
  reset,
}) {
  return {
    state: {
      strings: instrument.strings,
      frets: instrument.frets,
      tuning: instrument.tuning,
      systemId: instrument.systemId,
      selectedPreset: presets.selectedPreset,
      neckFilterMode: instrument.neckFilterMode,
    },
    actions: {
      setFrets: handlers.setFretsUI,
      setSystemId: handlers.setSystemId,
      setTuning: handlers.setTuning,
      handleStringsChange: handlers.handleStringsChange,
      setSelectedPreset: presets.setPreset,
      handleSaveDefault: handlers.handleSaveDefault,
      setNeckFilterMode: handlers.setNeckFilterMode,
      handleResetFactoryDefault: reset.resetInstrumentFactory,
      onCreateCustomPack: handlers.openCreate,
      onEditCustomPack: handlers.openEditSelected,
    },
    meta: {
      systems: instrument.tunings,
      sysNames: instrument.sysNames,
      noteNaming: instrument.noteNaming,
      presetNames: presets.mergedPresetNames,
      customPresetNames: presets.customPresetNames,
      presetMetaMap: presets.mergedPresetMetaMap,
    },
  };
}
