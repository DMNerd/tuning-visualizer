const METRONOME_TIME_SIGNATURES = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8"];
const METRONOME_SUBDIVISIONS = ["Quarter", "Eighth", "Triplet", "Sixteenth"];

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
      timedPracticeEnabled: metronome.timedPracticeEnabled,
      practiceDurationMinutes: metronome.safePracticeDurationMinutes,
      practiceSecondsRemaining: metronome.secondsRemaining,
      isRoutinePlaying: metronome.isRoutinePlaying,
    },
    actions: {
      setBpm: controls.setBpm,
      setTimeSig: controls.setTimeSig,
      setSubdivision: controls.setSubdivision,
      setCountInEnabled: controls.setCountInEnabled,
      setAutoAdvanceEnabled: controls.setAutoAdvanceEnabled,
      setBarsPerScale: controls.setBarsPerScale,
      setAnnounceCountInBeforeChange: controls.setAnnounceCountInBeforeChange,
      setTimedPracticeEnabled: controls.setTimedPracticeEnabled,
      setPracticeDurationMinutes: controls.setPracticeDurationMinutes,
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
      practiceDurationMin: 1,
      practiceDurationMax: 180,
      timeSignatures: METRONOME_TIME_SIGNATURES,
      subdivisions: METRONOME_SUBDIVISIONS,
    },
  };
}
