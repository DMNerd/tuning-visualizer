import React from "react";
import clsx from "clsx";
import Section from "@/components/UI/Section";
import { LABEL_OPTIONS } from "@/hooks/useLabels";
import { MICRO_LABEL_STYLES } from "@/utils/fretLabels";
import { getDegreeColor } from "@/utils/degreeColors";
import { Tooltip } from "react-tooltip";
import { FiInfo } from "react-icons/fi";
import { memoWithShallowPick } from "@/utils/memo";
import { DOT_SIZE_MAX, DOT_SIZE_MIN } from "@/lib/config/appDefaults";
import ToggleSwitch from "@/components/UI/ToggleSwitch";

function DegreeLegend({ k = 7 }) {
  if (!Number.isFinite(k) || k < 1) return null;

  return (
    <div className="tv-legend">
      <div className="tv-legend__swatches">
        {Array.from({ length: k }, (_, i) => {
          const degree = i + 1;
          const color = getDegreeColor(degree, k);
          return (
            <div
              className="tv-legend__swatch"
              key={degree}
              title={`Degree ${degree}`}
            >
              <svg
                className="tv-legend__dot"
                aria-hidden
                width="18"
                height="18"
                viewBox="0 0 18 18"
              >
                <circle cx="9" cy="9" r="8" fill={color} stroke="var(--line)" />
              </svg>
              <small>{degree}</small>
            </div>
          );
        })}
      </div>
      <p>1 = tonic (root color).</p>
    </div>
  );
}

function DisplayControls({ state, actions, meta }) {
  const {
    show,
    showOpen,
    showFretNums,
    dotSize,
    openOnlyInScale,
    accidental,
    noteNaming,
    microLabelStyle,
    colorByDegree,
    lefty,
  } = state;
  const {
    setShow,
    setShowOpen,
    setShowFretNums,
    setDotSize,
    setOpenOnlyInScale,
    setAccidental,
    setNoteNaming,
    setMicroLabelStyle,
    setColorByDegree,
    setLefty,
  } = actions;
  const degreeCount = meta?.degreeCount ?? 7;
  const accidentalGroupLabelId = React.useId();
  const noteNamingInputId = React.useId();
  const noteNamingLabelId = React.useId();
  const labelsInputId = React.useId();
  const labelsFieldLabelId = React.useId();
  const microLabelStyleInputId = React.useId();
  const microLabelStyleLabelId = React.useId();
  const openScopeGroupLabelId = React.useId();
  const dotSizeInputId = React.useId();
  const dotSizeLabelId = React.useId();

  return (
    <Section id="display-controls" title="Display">
      <div className={clsx("tv-controls", "tv-controls--display")}>
        <div className="tv-controls__group" role="region" aria-label="Notation">
          <div className="tv-field">
            <span className="tv-field__label" id={accidentalGroupLabelId}>
              Accidentals
            </span>
            <div
              role="group"
              aria-labelledby={accidentalGroupLabelId}
              className="tv-binary-toggle"
            >
              <label className="tv-binary-toggle__option" htmlFor="acc-sharp">
                <input
                  className="tv-binary-toggle__input"
                  id="acc-sharp"
                  name="accidental"
                  type="radio"
                  value="sharp"
                  checked={accidental === "sharp"}
                  onChange={() => setAccidental("sharp")}
                />
                <span className="tv-binary-toggle__label">Sharps (C, C#, D…)</span>
              </label>
              <label className="tv-binary-toggle__option" htmlFor="acc-flat">
                <input
                  className="tv-binary-toggle__input"
                  id="acc-flat"
                  name="accidental"
                  type="radio"
                  value="flat"
                  checked={accidental === "flat"}
                  onChange={() => setAccidental("flat")}
                />
                <span className="tv-binary-toggle__label">Flats (C, Db, D…)</span>
              </label>
            </div>
          </div>

          <div className="tv-field">
            <label
              className="tv-field__label"
              htmlFor={noteNamingInputId}
              id={noteNamingLabelId}
            >
              Note naming
            </label>
            <select
              id={noteNamingInputId}
              name="noteNaming"
              value={noteNaming}
              aria-labelledby={noteNamingLabelId}
              onChange={(e) => setNoteNaming(e.target.value)}
            >
              <option value="english">International (B)</option>
              <option value="german">German/Czech (H/B)</option>
            </select>
          </div>

          <div className="tv-field">
            <label
              className="tv-field__label"
              htmlFor={labelsInputId}
              id={labelsFieldLabelId}
            >
              Labels
            </label>
            <select
              id={labelsInputId}
              name="labels"
              value={show}
              aria-labelledby={labelsFieldLabelId}
              onChange={(e) => setShow(e.target.value)}
            >
              {LABEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="tv-field">
            <label
              className="tv-field__label"
              htmlFor={microLabelStyleInputId}
              id={microLabelStyleLabelId}
            >
              Micro-fret labels
            </label>
            <select
              id={microLabelStyleInputId}
              name="microLabelStyle"
              value={microLabelStyle}
              aria-labelledby={microLabelStyleLabelId}
              onChange={(e) => setMicroLabelStyle(e.target.value)}
            >
              <option value={MICRO_LABEL_STYLES.Letters}>
                Letters (a, aa…)
              </option>
              <option value={MICRO_LABEL_STYLES.Accidentals}>
                Accidentals (s / b)
              </option>
              <option value={MICRO_LABEL_STYLES.Fractions}>
                Fractions (n+rem/N)
              </option>
            </select>
          </div>

          <ToggleSwitch
            id="colorByDegree"
            name="colorByDegree"
            checked={colorByDegree}
            onChange={(e) => setColorByDegree(e.target.checked)}
          >
            Color notes by scale degree
            <span
              className="tv-tip"
              data-tooltip-id="deg-colors-tip"
              data-tooltip-place="right"
              aria-label="Explain scale-degree colors"
              role="button"
              tabIndex={0}
            >
              <FiInfo size={14} aria-hidden="true" />
            </span>
            <Tooltip id="deg-colors-tip" clickable className="tv-tooltip">
              <DegreeLegend k={degreeCount} />
            </Tooltip>
          </ToggleSwitch>
        </div>

        <div
          className="tv-controls__group"
          role="region"
          aria-label="Open strings"
          aria-disabled={!showOpen}
        >
          <div className="tv-field">
            <span className="tv-field__label" id={openScopeGroupLabelId}>
              Open notes
            </span>
            <div
              role="group"
              aria-labelledby={openScopeGroupLabelId}
              className="tv-controls__radio-row"
            >
              <ToggleSwitch
                id="showOpen"
                name="showOpen"
                checked={showOpen}
                onChange={(e) => setShowOpen(e.target.checked)}
              >
                Show open notes
              </ToggleSwitch>
              <label className="tv-check" htmlFor="open-all">
                <input
                  id="open-all"
                  name="open-scope"
                  type="radio"
                  checked={!openOnlyInScale}
                  onChange={() => setOpenOnlyInScale(false)}
                  disabled={!showOpen}
                />
                All strings
              </label>
              <label className="tv-check" htmlFor="open-scale">
                <input
                  id="open-scale"
                  name="open-scope"
                  type="radio"
                  checked={openOnlyInScale}
                  onChange={() => setOpenOnlyInScale(true)}
                  disabled={!showOpen}
                />
                In current scale
              </label>
            </div>
          </div>
        </div>

        <div
          className="tv-controls__group"
          role="region"
          aria-label="Markers and sizing"
        >
          <ToggleSwitch
            id="showFretNums"
            name="showFretNums"
            checked={showFretNums}
            onChange={(e) => setShowFretNums(e.target.checked)}
          >
            Show fret numbers
          </ToggleSwitch>

          <div className="tv-field">
            <label
              className="tv-field__label"
              htmlFor={dotSizeInputId}
              id={dotSizeLabelId}
            >
              Dot size
            </label>
            <input
              id={dotSizeInputId}
              name="dotSize"
              type="range"
              min={DOT_SIZE_MIN}
              max={DOT_SIZE_MAX}
              value={dotSize}
              aria-labelledby={dotSizeLabelId}
              onChange={(e) => setDotSize(parseInt(e.target.value, 10))}
            />
          </div>

          <ToggleSwitch
            id="lefty"
            name="lefty"
            checked={lefty}
            onChange={(e) => setLefty(e.target.checked)}
          >
            Left-handed layout
          </ToggleSwitch>
        </div>
      </div>
    </Section>
  );
}

function pickDisplayMemoProps(p) {
  const s = p.state ?? {};
  const a = p.actions ?? {};
  const m = p.meta ?? {};
  return {
    show: s.show,
    showOpen: s.showOpen,
    showFretNums: s.showFretNums,
    dotSize: s.dotSize,
    openOnlyInScale: s.openOnlyInScale,
    accidental: s.accidental,
    noteNaming: s.noteNaming,
    microLabelStyle: s.microLabelStyle,
    colorByDegree: s.colorByDegree,
    lefty: s.lefty,
    degreeCount: m.degreeCount,
    setShow: a.setShow,
    setShowOpen: a.setShowOpen,
    setShowFretNums: a.setShowFretNums,
    setDotSize: a.setDotSize,
    setOpenOnlyInScale: a.setOpenOnlyInScale,
    setAccidental: a.setAccidental,
    setNoteNaming: a.setNoteNaming,
    setMicroLabelStyle: a.setMicroLabelStyle,
    setColorByDegree: a.setColorByDegree,
    setLefty: a.setLefty,
  };
}

// React Profiler note: Display updates frequently while dragging dot size and
// toggling UI controls, so we avoid deep `dequal` and compare stable primitive
// values + handler identities with a shallow pick.
const DisplayControlsMemo = memoWithShallowPick(
  DisplayControls,
  pickDisplayMemoProps,
);

export default DisplayControlsMemo;
