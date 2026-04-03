const METRONOME_TIME_SIGNATURES = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8"];
const METRONOME_SUBDIVISIONS = ["Quarter", "Eighth", "Triplet", "Sixteenth"];

export function adaptMetronomeControls({ metronome, controls }) {
  return {
    state: {
      isPlaying: metronome.isPlaying,
      bpm: metronome.bpm,
      timeSig: metronome.timeSig,
      subdivision: metronome.subdivision,
      countInEnabled: metronome.countInEnabled,
      autoAdvanceEnabled: metronome.autoAdvanceEnabled,
      barsPerScale: metronome.safeBarsPerScale,
      announceCountInBeforeChange: metronome.announceCountInBeforeChange,
      barsRemaining: metronome.barsRemaining,
    },
    actions: {
      setBpm: controls.setBpm,
      setTimeSig: controls.setTimeSig,
      setSubdivision: controls.setSubdivision,
      setCountInEnabled: controls.setCountInEnabled,
      setAutoAdvanceEnabled: controls.setAutoAdvanceEnabled,
      setBarsPerScale: controls.setBarsPerScale,
      setAnnounceCountInBeforeChange: controls.setAnnounceCountInBeforeChange,
      toggleMetronome: controls.toggleMetronome,
      bpmUp: controls.bpmUp,
      bpmDown: controls.bpmDown,
      tapTempo: controls.tapTempo,
      randomizeScaleNow: controls.randomizeScaleNow,
    },
    meta: {
      bpmMin: 20,
      bpmMax: 300,
      barsPerScaleMin: 1,
      barsPerScaleMax: 64,
      timeSignatures: METRONOME_TIME_SIGNATURES,
      subdivisions: METRONOME_SUBDIVISIONS,
    },
  };
}

export function adaptDisplayControls({ displayPrefs, displaySetters, degreeCount }) {
  return {
    state: {
      show: displayPrefs.show,
      showOpen: displayPrefs.showOpen,
      showFretNums: displayPrefs.showFretNums,
      dotSize: displayPrefs.dotSize,
      openOnlyInScale: displayPrefs.openOnlyInScale,
      accidental: displayPrefs.accidental,
      microLabelStyle: displayPrefs.microLabelStyle,
      colorByDegree: displayPrefs.colorByDegree,
      lefty: displayPrefs.lefty,
    },
    actions: {
      setShow: displaySetters.setShow,
      setShowOpen: displaySetters.setShowOpen,
      setShowFretNums: displaySetters.setShowFretNums,
      setDotSize: displaySetters.setDotSize,
      setOpenOnlyInScale: displaySetters.setOpenOnlyInScale,
      setAccidental: displaySetters.setAccidental,
      setMicroLabelStyle: displaySetters.setMicroLabelStyle,
      setColorByDegree: displaySetters.setColorByDegree,
      setLefty: displaySetters.setLefty,
    },
    meta: {
      degreeCount,
    },
  };
}

export function adaptInstrumentControls({ state, preset, handlers, reset }) {
  return {
    state: {
      strings: state.strings,
      frets: state.frets,
      tuning: state.tuning,
      systemId: state.systemId,
      selectedPreset: preset.selectedPreset,
    },
    actions: {
      setFrets: handlers.setFretsPref,
      setSystemId: handlers.setSystemId,
      setTuning: handlers.setTuning,
      handleStringsChange: handlers.handleStringsChange,
      setSelectedPreset: preset.setPreset,
      handleSaveDefault: handlers.handleSaveDefault,
      handleResetFactoryDefault: reset.resetInstrumentFactory,
      onCreateCustomPack: handlers.openCreate,
      onEditCustomPack: handlers.openEditSelected,
    },
    meta: {
      systems: state.tunings,
      sysNames: state.sysNames,
      presetNames: preset.mergedPresetNames,
      customPresetNames: preset.customPresetNames,
      presetMetaMap: preset.mergedPresetMetaMap,
    },
  };
}
