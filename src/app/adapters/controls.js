const METRONOME_TIME_SIGNATURES = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8"];
const METRONOME_SUBDIVISIONS = ["Quarter", "Eighth", "Triplet", "Sixteenth"];

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
    },
    actions: {
      setFrets: handlers.setFretsPref,
      setSystemId: handlers.setSystemId,
      setTuning: handlers.setTuning,
      handleStringsChange: handlers.handleStringsChange,
      setSelectedPreset: presets.setPreset,
      handleSaveDefault: handlers.handleSaveDefault,
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

export function buildMetronomeControlModel({ metronome, controls }) {
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

export function buildDisplayControlModel({
  displayPrefs,
  displaySetters,
  degreeCount,
}) {
  return {
    state: {
      show: displayPrefs.show,
      showOpen: displayPrefs.showOpen,
      showFretNums: displayPrefs.showFretNums,
      dotSize: displayPrefs.dotSize,
      openOnlyInScale: displayPrefs.openOnlyInScale,
      accidental: displayPrefs.accidental,
      noteNaming: displayPrefs.noteNaming,
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
      setNoteNaming: displaySetters.setNoteNaming,
      setMicroLabelStyle: displaySetters.setMicroLabelStyle,
      setColorByDegree: displaySetters.setColorByDegree,
      setLefty: displaySetters.setLefty,
    },
    meta: {
      degreeCount,
    },
  };
}

export function buildTheoryControlModel({
  system,
  scale,
  chord,
  randomize,
  defaults,
}) {
  const divisions =
    Number(system?.system?.divisions) || system?.sysNames?.length || 12;
  const scaleIntervals = Array.isArray(scale?.intervals) ? scale.intervals : [];
  const safeRootIx = Number.isFinite(system?.rootIx) ? system.rootIx : 0;

  const scaleTonePcs = scaleIntervals.map(
    (interval) =>
      (((safeRootIx + interval) % divisions) + divisions) % divisions,
  );
  const scaleToneLabels = scaleTonePcs.map((pc) =>
    typeof system?.nameForPc === "function" ? system.nameForPc(pc) : String(pc),
  );

  const chordTonePcs = chord?.chordTonePcs;
  const chordOverlayPcs = chord?.chordOverlayPcs;

  return {
    state: {
      root: scale?.root,
      scale: scale?.scale,
      intervals: scaleIntervals,
      randomizeMode: randomize?.randomizeMode,
      chordRoot: chord?.chordRoot,
      chordType: chord?.chordType,
      showChord: chord?.showChord,
      hideNonChord: chord?.hideNonChord,
      defaultRoot: defaults?.root,
      defaultScale: defaults?.scale,
      defaultChordRoot: defaults?.chordRoot,
      defaultChordType: defaults?.chordType,
    },
    actions: {
      setRoot: scale?.setRoot,
      setScale: scale?.setScale,
      setRandomizeMode: randomize?.setRandomizeMode,
      onRandomize: randomize?.onRandomize,
      onRootChange: chord?.setChordRoot,
      onTypeChange: chord?.setChordType,
      setShowChord: chord?.setShowChord,
      setHideNonChord: chord?.setHideNonChord,
    },
    meta: {
      sysNames: system?.sysNames ?? [],
      scaleOptions: scale?.scaleOptions ?? [],
      scaleTonePcs,
      scaleToneLabels,
      chordTonePcs,
      chordOverlayPcs,
      supportsMicrotonal: Number(system?.system?.divisions) > 12,
      system: system?.system,
      rootIx: safeRootIx,
      nameForPc: system?.nameForPc,
      chordRootPc: chord?.chordRootIx,
    },
  };
}
