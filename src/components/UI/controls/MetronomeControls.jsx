import clsx from "clsx";
import Section from "@/components/UI/Section";
import { memoWithPick } from "@/utils/memo";

const TIME_SIGNATURES = ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8"];
const SUBDIVISIONS = ["Quarter", "Eighth", "Triplet", "Sixteenth"];

function MetronomeControls({
  isPlaying,
  bpm,
  setBpm,
  timeSig,
  setTimeSig,
  subdivision,
  setSubdivision,
  countInEnabled,
  setCountInEnabled,
  autoAdvanceEnabled,
  setAutoAdvanceEnabled,
  barsPerScale,
  setBarsPerScale,
  announceCountInBeforeChange,
  setAnnounceCountInBeforeChange,
  barsRemaining,
  toggleMetronome,
  bpmUp,
  bpmDown,
  tapTempo,
  randomizeScaleNow,
}) {
  return (
    <Section title="Metronome" size="sm">
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
          <button
            type="button"
            className="tv-button"
            onClick={() => randomizeScaleNow?.()}
          >
            Next scale now
          </button>
        </div>

        <div className="tv-field">
          <label className="tv-field__label" htmlFor="metronome-bpm">
            BPM
          </label>
          <div className="tv-controls__input-row">
            <button
              type="button"
              className="tv-button tv-button--icon"
              aria-label="Decrease BPM"
              onClick={() => bpmDown?.()}
            >
              −
            </button>
            <input
              id="metronome-bpm"
              name="metronome-bpm"
              type="number"
              min={20}
              max={300}
              step={1}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value) || 20)}
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
              {TIME_SIGNATURES.map((option) => (
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
              {SUBDIVISIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="tv-check" htmlFor="metronome-count-in">
          <input
            id="metronome-count-in"
            name="metronome-count-in"
            type="checkbox"
            checked={countInEnabled}
            onChange={(e) => setCountInEnabled(e.target.checked)}
          />
          Count-in enabled
        </label>

        <label className="tv-check" htmlFor="metronome-auto-advance">
          <input
            id="metronome-auto-advance"
            name="metronome-auto-advance"
            type="checkbox"
            checked={autoAdvanceEnabled}
            onChange={(e) => setAutoAdvanceEnabled(e.target.checked)}
          />
          Auto-advance scale
        </label>

        <div className="tv-field">
          <label className="tv-field__label" htmlFor="metronome-bars-per-scale">
            Bars per scale
          </label>
          <input
            id="metronome-bars-per-scale"
            name="metronome-bars-per-scale"
            type="number"
            min={1}
            max={64}
            step={1}
            value={barsPerScale}
            onChange={(e) =>
              setBarsPerScale(Math.max(1, Number(e.target.value) || 1))
            }
            disabled={!autoAdvanceEnabled}
          />
          {autoAdvanceEnabled ? (
            <small className="tv-field__hint">
              {barsRemaining} bar{barsRemaining === 1 ? "" : "s"} until next
              scale
            </small>
          ) : null}
        </div>

        <label className="tv-check" htmlFor="metronome-announce-count-in">
          <input
            id="metronome-announce-count-in"
            name="metronome-announce-count-in"
            type="checkbox"
            checked={announceCountInBeforeChange}
            onChange={(e) => setAnnounceCountInBeforeChange(e.target.checked)}
            disabled={!autoAdvanceEnabled}
          />
          Announce before change
        </label>
      </div>
    </Section>
  );
}

function pick(p) {
  return {
    isPlaying: p.isPlaying,
    bpm: p.bpm,
    timeSig: p.timeSig,
    subdivision: p.subdivision,
    countInEnabled: p.countInEnabled,
    autoAdvanceEnabled: p.autoAdvanceEnabled,
    barsPerScale: p.barsPerScale,
    announceCountInBeforeChange: p.announceCountInBeforeChange,
    barsRemaining: p.barsRemaining,
    setBpm: p.setBpm,
    setTimeSig: p.setTimeSig,
    setSubdivision: p.setSubdivision,
    setCountInEnabled: p.setCountInEnabled,
    setAutoAdvanceEnabled: p.setAutoAdvanceEnabled,
    setBarsPerScale: p.setBarsPerScale,
    setAnnounceCountInBeforeChange: p.setAnnounceCountInBeforeChange,
    toggleMetronome: p.toggleMetronome,
    bpmUp: p.bpmUp,
    bpmDown: p.bpmDown,
    tapTempo: p.tapTempo,
    randomizeScaleNow: p.randomizeScaleNow,
  };
}

const MetronomeControlsMemo = memoWithPick(MetronomeControls, pick);

export default MetronomeControlsMemo;
