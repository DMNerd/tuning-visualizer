import React from "react";
import { dequal } from "dequal";
import clsx from "clsx";
import Section from "@/components/UI/Section";
import { LABEL_OPTIONS } from "@/hooks/useLabels";
import { MICRO_LABEL_STYLES } from "@/utils/fretLabels";
import { getDegreeColor } from "@/utils/degreeColors";
import { Tooltip } from "react-tooltip";
import { FiInfo } from "react-icons/fi";

function DegreeLegend({ k = 7 }) {
  if (!Number.isFinite(k) || k < 1) return null;

  return (
    <div className="tv-legend">
      <div className="swatches">
        {Array.from({ length: k }, (_, i) => {
          const degree = i + 1;
          const color = getDegreeColor(degree, k);
          return (
            <div className="swatch" key={degree} title={`Degree ${degree}`}>
              <svg
                className="dot"
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

function DisplayControls({
  show,
  setShow,
  showOpen,
  setShowOpen,
  showFretNums,
  setShowFretNums,
  dotSize,
  setDotSize,
  openOnlyInScale,
  setOpenOnlyInScale,
  accidental,
  setAccidental,
  microLabelStyle,
  setMicroLabelStyle,
  colorByDegree,
  setColorByDegree,
  lefty,
  setLefty,
  degreeCount = 7,
}) {
  return (
    <Section title="Display">
      <div className={clsx("control-panel", "display-controls")}>
        <div className="group" role="region" aria-label="Notation">
          <div className="field">
            <span>Accidentals</span>
            <div role="group" aria-label="Accidentals" className="radio-row">
              <label className="check" htmlFor="acc-sharp">
                <input
                  id="acc-sharp"
                  name="accidental"
                  type="radio"
                  value="sharp"
                  checked={accidental === "sharp"}
                  onChange={() => setAccidental("sharp")}
                />
                Sharps (C, C#, D…)
              </label>
              <label className="check" htmlFor="acc-flat">
                <input
                  id="acc-flat"
                  name="accidental"
                  type="radio"
                  value="flat"
                  checked={accidental === "flat"}
                  onChange={() => setAccidental("flat")}
                />
                Flats (C, Db, D…)
              </label>
            </div>
          </div>

          <div className="field">
            <span>Labels</span>
            <select
              id="labels"
              name="labels"
              value={show}
              onChange={(e) => setShow(e.target.value)}
            >
              {LABEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <span>Micro-fret labels</span>
            <select
              id="microLabelStyle"
              name="microLabelStyle"
              value={microLabelStyle}
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

          <label className="check" htmlFor="colorByDegree">
            <input
              id="colorByDegree"
              name="colorByDegree"
              type="checkbox"
              checked={colorByDegree}
              onChange={(e) => setColorByDegree(e.target.checked)}
            />{" "}
            Color notes by scale degree
            <span
              className="tip-trigger"
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
          </label>
        </div>

        <div
          className="group"
          role="region"
          aria-label="Open strings"
          aria-disabled={!showOpen}
        >
          <div className="field">
            <span>Open notes</span>
            <div
              role="group"
              aria-label="Open note scope"
              className="radio-row"
            >
              <label className="check" htmlFor="showOpen">
                <input
                  id="showOpen"
                  name="showOpen"
                  type="checkbox"
                  checked={showOpen}
                  onChange={(e) => setShowOpen(e.target.checked)}
                />{" "}
                Show open notes
              </label>
              <label className="check" htmlFor="open-all">
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
              <label className="check" htmlFor="open-scale">
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

        <div className="group" role="region" aria-label="Markers and sizing">
          <label className="check" htmlFor="showFretNums">
            <input
              id="showFretNums"
              name="showFretNums"
              type="checkbox"
              checked={showFretNums}
              onChange={(e) => setShowFretNums(e.target.checked)}
            />{" "}
            Show fret numbers
          </label>

          <div className="field">
            <span>Dot size</span>
            <input
              id="dotSize"
              name="dotSize"
              type="range"
              min="8"
              max="24"
              value={dotSize}
              onChange={(e) => setDotSize(parseInt(e.target.value, 10))}
            />
          </div>

          <label className="check" htmlFor="lefty">
            <input
              id="lefty"
              name="lefty"
              type="checkbox"
              checked={lefty}
              onChange={(e) => setLefty(e.target.checked)}
            />{" "}
            Left-handed layout
          </label>
        </div>
      </div>
    </Section>
  );
}

function pick(p) {
  return {
    show: p.show,
    showOpen: p.showOpen,
    showFretNums: p.showFretNums,
    dotSize: p.dotSize,
    openOnlyInScale: p.openOnlyInScale,
    accidental: p.accidental,
    microLabelStyle: p.microLabelStyle,
    colorByDegree: p.colorByDegree,
    lefty: p.lefty,
    degreeCount: p.degreeCount,
  };
}
export default React.memo(DisplayControls, (a, b) => dequal(pick(a), pick(b)));
