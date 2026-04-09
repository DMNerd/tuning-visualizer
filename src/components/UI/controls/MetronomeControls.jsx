import clsx from "clsx";
import Section from "@/components/UI/Section";
import { memoWithShallowPick } from "@/utils/memo";
import ToggleSwitch from "@/components/UI/ToggleSwitch";
import NumberField from "@/components/UI/NumberField";

const TIME_SIGNATURES = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8"];
const SUBDIVISIONS = ["Quarter", "Eighth", "Triplet", "Sixteenth"];

function MetronomeControls({ state, actions, meta }) {
  const {
    isPlaying,
    bpm,
    timeSig,
    subdivision,
    countInEnabled,
    autoAdvanceEnabled,
    barsPerScale,
    announceCountInBeforeChange,
    barsRemaining,
  } = state;

  const {
    setBpm,
    setTimeSig,
    setSubdivision,
    setCountInEnabled,
    setAutoAdvanceEnabled,
    setBarsPerScale,
    setAnnounceCountInBeforeChange,
    toggleMetronome,
    bpmUp,
    bpmDown,
    tapTempo,
  } = actions;

  const timeSignatures = meta?.timeSignatures ?? TIME_SIGNATURES;
  const subdivisions = meta?.subdivisions ?? SUBDIVISIONS;
  const bpmMin = meta?.bpmMin ?? 20;
  const bpmMax = meta?.bpmMax ?? 300;
  const barsPerScaleMin = meta?.barsPerScaleMin ?? 1;
  const barsPerScaleMax = meta?.barsPerScaleMax ?? 64;

  return (
    <Section id="metronome-controls" title="Metronome" size="sm">
      <div className={clsx("tv-controls", "tv-controls--metronome")}>
        <div className="tv-controls__input-row">
          <button
            type="button"
            className="tv-button"
            onClick={() => toggleMetronome?.()}
          >
            {isPlaying ? "Stop" : "Start"}
          </button>
          <button
            type="button"
            className="tv-button"
            onClick={() => tapTempo?.()}
          >
            Tap tempo
          </button>
        </div>

        <div className="tv-field">
          <label className="tv-field__label" htmlFor="metronome-bpm">
            BPM
          </label>
          <div className="tv-controls__input-row tv-controls__input-row--align-input">
            <button
              type="button"
              className="tv-button tv-button--icon"
              aria-label="Decrease BPM"
              onClick={() => bpmDown?.()}
            >
              −
            </button>
            <NumberField
              id="metronome-bpm"
              label="BPM value"
              value={bpm}
              min={bpmMin}
              max={bpmMax}
              onSubmit={setBpm}
              hideLabel
              className="tv-field--inline-number tv-field--number-compact"
            />
            <button
              type="button"
              className="tv-button tv-button--icon"
              aria-label="Increase BPM"
              onClick={() => bpmUp?.()}
            >
              +
            </button>
          </div>
        </div>

        <div className="tv-controls__grid--two">
          <div className="tv-field">
            <label
              className="tv-field__label"
              htmlFor="metronome-time-signature"
            >
              Time signature
            </label>
            <select
              id="metronome-time-signature"
              name="metronome-time-signature"
              value={timeSig}
              onChange={(e) => setTimeSig(e.target.value)}
            >
              {timeSignatures.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="tv-field">
            <label className="tv-field__label" htmlFor="metronome-subdivision">
              Subdivision
            </label>
            <select
              id="metronome-subdivision"
              name="metronome-subdivision"
              value={subdivision}
              onChange={(e) => setSubdivision(e.target.value)}
            >
              {subdivisions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ToggleSwitch
          id="metronome-count-in"
          name="metronome-count-in"
          checked={countInEnabled}
          onChange={(e) => setCountInEnabled(e.target.checked)}
        >
          Count-in enabled
        </ToggleSwitch>

        <ToggleSwitch
          id="metronome-auto-advance"
          name="metronome-auto-advance"
          checked={autoAdvanceEnabled}
          onChange={(e) => setAutoAdvanceEnabled(e.target.checked)}
        >
          Auto-advance scale
        </ToggleSwitch>

        <NumberField
          id="metronome-bars-per-scale"
          label="Bars per scale"
          value={barsPerScale}
          min={barsPerScaleMin}
          max={barsPerScaleMax}
          onSubmit={setBarsPerScale}
          className="tv-field--number-compact"
        />
        <div className="tv-field">
          {autoAdvanceEnabled ? (
            <small className="tv-field__hint">
              {barsRemaining} bar{barsRemaining === 1 ? "" : "s"} until next
              scale
            </small>
          ) : null}
        </div>

        <ToggleSwitch
          id="metronome-announce-count-in"
          name="metronome-announce-count-in"
          checked={announceCountInBeforeChange}
          onChange={(e) => setAnnounceCountInBeforeChange(e.target.checked)}
          disabled={!autoAdvanceEnabled}
        >
          Announce before change
        </ToggleSwitch>
      </div>
    </Section>
  );
}

function pickMetronomeMemoProps(p) {
  const s = p.state ?? {};
  const a = p.actions ?? {};
  const m = p.meta ?? {};
  return {
    isPlaying: s.isPlaying,
    bpm: s.bpm,
    timeSig: s.timeSig,
    subdivision: s.subdivision,
    countInEnabled: s.countInEnabled,
    autoAdvanceEnabled: s.autoAdvanceEnabled,
    barsPerScale: s.barsPerScale,
    announceCountInBeforeChange: s.announceCountInBeforeChange,
    barsRemaining: s.barsRemaining,
    timeSignatures: m.timeSignatures,
    subdivisions: m.subdivisions,
    bpmMin: m.bpmMin,
    bpmMax: m.bpmMax,
    barsPerScaleMin: m.barsPerScaleMin,
    barsPerScaleMax: m.barsPerScaleMax,
    setBpm: a.setBpm,
    setTimeSig: a.setTimeSig,
    setSubdivision: a.setSubdivision,
    setCountInEnabled: a.setCountInEnabled,
    setAutoAdvanceEnabled: a.setAutoAdvanceEnabled,
    setBarsPerScale: a.setBarsPerScale,
    setAnnounceCountInBeforeChange: a.setAnnounceCountInBeforeChange,
    toggleMetronome: a.toggleMetronome,
    bpmUp: a.bpmUp,
    bpmDown: a.bpmDown,
    tapTempo: a.tapTempo,
  };
}

// React Profiler note: metronome ticks can drive rapid renders; shallow key
// comparison keeps comparator overhead low while still tracking all used props.
const MetronomeControlsMemo = memoWithShallowPick(
  MetronomeControls,
  pickMetronomeMemoProps,
);

export default MetronomeControlsMemo;
