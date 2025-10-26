import React from "react";
import { dequal } from "dequal";
import clsx from "clsx";
import Section from "@/components/UI/Section";
import {
  CHORD_TYPES,
  CHORD_LABELS,
  STANDARD_CHORD_TYPES,
} from "@/lib/theory/chords";
import { FiRotateCcw } from "react-icons/fi";

function ChordBuilder({
  root,
  onRootChange,
  sysNames,
  type,
  onTypeChange,
  showChord,
  setShowChord,
  hideNonChord,
  setHideNonChord,
  defaultRoot = "C",
  defaultType = "maj",
  supportsMicrotonal = false,
}) {
  const resetDefaults = () => {
    onRootChange(defaultRoot);
    onTypeChange(defaultType);
    setShowChord(false);
    setHideNonChord(false);
  };

  const chordTypes = supportsMicrotonal ? CHORD_TYPES : STANDARD_CHORD_TYPES;

  return (
    <Section title="Chord Builder" size="sm">
      <div className={clsx("tv-controls", "tv-controls--chord")}>
        <div className="tv-controls__grid--two">
          <div className="tv-field">
            <span className="tv-field__label">Root</span>
            <select
              id="chord-root"
              name="chord-root"
              value={root}
              onChange={(e) => onRootChange(e.target.value)}
            >
              {sysNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="tv-field">
            <span className="tv-field__label">Type</span>
            <div className="tv-controls__input-row">
              <select
                id="chord-type"
                name="chord-type"
                value={type}
                onChange={(e) => onTypeChange(e.target.value)}
              >
                {chordTypes.map((t) => (
                  <option key={t} value={t}>
                    {CHORD_LABELS[t]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="tv-button tv-button--icon"
                aria-label="Reset chord builder to defaults"
                title="Reset to default"
                onClick={resetDefaults}
              >
                <FiRotateCcw size={16} aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <div className="tv-field">
          <span className="tv-field__label">Chord overlay</span>
          <div
            className="tv-controls__radio-row"
            role="group"
            aria-label="Chord overlay"
            aria-disabled={!showChord}
          >
            <label className="tv-check tv-check--accent" htmlFor="showChord">
              <input
                id="showChord"
                name="showChord"
                type="checkbox"
                checked={showChord}
                onChange={(e) => setShowChord(e.target.checked)}
              />
              Show chord
            </label>

            <label className="tv-check" htmlFor="hideNonChord">
              <input
                id="hideNonChord"
                name="hideNonChord"
                type="checkbox"
                checked={hideNonChord}
                onChange={(e) => setHideNonChord(e.target.checked)}
                disabled={!showChord}
              />
              Hide non-chord tones
            </label>
          </div>
        </div>
      </div>
    </Section>
  );
}

function pick(p) {
  return {
    root: p.root,
    type: p.type,
    showChord: p.showChord,
    hideNonChord: p.hideNonChord,
    sysNames: p.sysNames,
    supportsMicrotonal: p.supportsMicrotonal,
  };
}

export default React.memo(ChordBuilder, (a, b) => dequal(pick(a), pick(b)));
