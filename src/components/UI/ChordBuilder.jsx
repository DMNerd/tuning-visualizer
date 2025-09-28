import React from "react";
import { dequal } from "dequal";
import Section from "@/components/UI/Section";
import { CHORD_TYPES, CHORD_LABELS } from "@/lib/theory/chords";

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
}) {
  return (
    <Section title="Chord Builder" size="sm">
      <div className="chord-controls">
        <div className="grid2">
          <div className="field">
            <span>Root</span>
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

          <div className="field">
            <span>Type</span>
            <select
              id="chord-type"
              name="chord-type"
              value={type}
              onChange={(e) => onTypeChange(e.target.value)}
            >
              {CHORD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CHORD_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <span>Chord overlay</span>
          <div
            className="radio-row"
            role="group"
            aria-label="Chord overlay"
            aria-disabled={!showChord}
          >
            <label className="check" htmlFor="showChord" data-primary>
              <input
                id="showChord"
                name="showChord"
                type="checkbox"
                checked={showChord}
                onChange={(e) => setShowChord(e.target.checked)}
              />
              Show chord
            </label>

            <label className="check" htmlFor="hideNonChord">
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
  };
}
export default React.memo(ChordBuilder, (a, b) => dequal(pick(a), pick(b)));
