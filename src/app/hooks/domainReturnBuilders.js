export function buildTheoryDomainReturn({ system, scale, chord, handlers }) {
  return { system, scale, chord, handlers };
}

export function buildInstrumentDomainReturn({
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
}) {
  return {
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
  };
}

export function buildPracticeMetronomeDomainReturn({
  randomize,
  metronome,
  practiceActions,
  reset,
  practicePanel,
  metronomeControlModel,
}) {
  return {
    randomize,
    metronome,
    practiceActions,
    reset,
    practicePanel,
    metronomeControlModel,
  };
}

export function buildExportCustomTuningDomainReturn({
  fileBase,
  exportPanel,
  modalPanel,
  packActions,
}) {
  return {
    fileBase,
    exportPanel,
    modalPanel,
    packActions,
  };
}
