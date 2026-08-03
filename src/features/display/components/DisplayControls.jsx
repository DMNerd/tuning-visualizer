import { useId } from "react";
import clsx from "clsx";
import Section from "@shared/ui/Section";
import { LABEL_OPTIONS } from "@features/fretboard";
import { MICRO_LABEL_STYLES } from "@shared/lib/fretLabels";
import { getDegreeColor } from "@shared/lib/degreeColors";
import { getShapeColor } from "@shared/lib/shapeColors";
import { FiInfo } from "react-icons/fi";
import { memoWithShallowPick } from "@shared/lib/memo";
import { DOT_SIZE_MAX, DOT_SIZE_MIN } from "@shared/config/appDefaults";
import ToggleSwitch from "@shared/ui/ToggleSwitch";
import SegmentedRadioGroup from "@shared/ui/SegmentedRadioGroup";

function DegreeLegend({ k = 7 }) {
  if (!Number.isFinite(k) || k < 1) return null;

  return (
    <div className="tv-legend" aria-live="polite">
      <p>
        <FiInfo className="tv-legend__info-icon" aria-hidden="true" />
        <span>Degree palette</span>
      </p>
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
                width="14"
                height="14"
                viewBox="0 0 14 14"
              >
                <circle cx="7" cy="7" r="6" fill={color} stroke="var(--line)" />
              </svg>
              <small>{degree}</small>
            </div>
          );
        })}
      </div>
      <small>1 = tonic (root)</small>
    </div>
  );
}

function ShapeLegend({ count = 5 }) {
  if (!Number.isFinite(count) || count < 1) return null;

  return (
    <div className="tv-legend" aria-live="polite">
      <p>
        <FiInfo className="tv-legend__info-icon" aria-hidden="true" />
        <span>Shape palette</span>
      </p>
      <div className="tv-legend__swatches">
        {Array.from({ length: count }, (_, i) => (
          <div className="tv-legend__swatch" key={i} title={`Shape ${i + 1}`}>
            <svg
              className="tv-legend__dot"
              aria-hidden
              width="14"
              height="14"
              viewBox="0 0 14 14"
            >
              <circle
                cx="7"
                cy="7"
                r="6"
                fill={getShapeColor(i)}
                stroke="var(--line)"
              />
            </svg>
            <small>{i + 1}</small>
          </div>
        ))}
      </div>
      <small>Colors follow detected shape windows across the fretboard.</small>
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
    openOnlyInChord,
    accidental,
    noteNaming,
    microLabelStyle,
    colorByDegree,
    colorByShape,
    lefty,
  } = state;
  const {
    setShow,
    setShowOpen,
    setShowFretNums,
    setDotSize,
    setOpenOnlyInScale,
    setOpenOnlyInChord,
    setAccidental,
    setNoteNaming,
    setMicroLabelStyle,
    setColorByDegree,
    setColorByShape,
    setLefty,
  } = actions;
  const degreeCount = meta?.degreeCount ?? 7;
  const resolvedShowOpen = showOpen !== false;
  const resolvedOpenOnlyInScale = resolvedShowOpen && openOnlyInScale === true;
  const resolvedOpenOnlyInChord = resolvedShowOpen && openOnlyInChord === true;
  const openNotesMode = !resolvedShowOpen
    ? "off"
    : resolvedOpenOnlyInChord
      ? "chord"
      : resolvedOpenOnlyInScale
        ? "scale"
        : "all";
  const labelsInputId = useId();
  const labelsFieldLabelId = useId();
  const dotSizeInputId = useId();
  const dotSizeLabelId = useId();

  return (
    <Section id="display-controls" title="Display">
      <div className={clsx("tv-controls", "tv-controls--display")}>
        <div className="tv-controls__group" role="region" aria-label="Notation">
          <SegmentedRadioGroup
            label="Accidentals"
            name="accidental"
            value={accidental}
            onChange={setAccidental}
            options={[
              { value: "sharp", label: "Sharps (C, C#, D…)" },
              { value: "flat", label: "Flats (C, Db, D…)" },
              { value: "both", label: "Both (C#, Db)" },
            ]}
          />

          <SegmentedRadioGroup
            label="Note naming"
            name="noteNaming"
            value={noteNaming}
            onChange={setNoteNaming}
            options={[
              { value: "english", label: "International (B)" },
              { value: "german", label: "German/Czech (H/B)" },
            ]}
          />

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

          <SegmentedRadioGroup
            label="Micro-fret labels"
            name="microLabelStyle"
            value={microLabelStyle}
            onChange={setMicroLabelStyle}
            options={[
              { value: MICRO_LABEL_STYLES.Letters, label: "Letters" },
              { value: MICRO_LABEL_STYLES.Accidentals, label: "Accidentals" },
              { value: MICRO_LABEL_STYLES.Fractions, label: "Fractions" },
            ]}
          />

          <SegmentedRadioGroup
            label="Note colors"
            name="note-color-mode"
            value={colorByDegree ? "degree" : colorByShape ? "shape" : "off"}
            onChange={(nextMode) => {
              if (nextMode === "degree") {
                setColorByDegree(true);
                setColorByShape(false);
                return;
              }
              if (nextMode === "shape") {
                setColorByDegree(false);
                setColorByShape(true);
                return;
              }
              setColorByDegree(false);
              setColorByShape(false);
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "degree", label: "Degree" },
              { value: "shape", label: "Shape" },
            ]}
          />

          {colorByDegree ? <DegreeLegend k={degreeCount} /> : null}
          {colorByShape ? <ShapeLegend /> : null}
        </div>

        <div
          className="tv-controls__group"
          role="region"
          aria-label="Open strings"
        >
          <SegmentedRadioGroup
            label="Open notes"
            name="open-notes-mode"
            value={openNotesMode}
            onChange={(nextMode) => {
              if (nextMode === "off") {
                setShowOpen(false);
                setOpenOnlyInScale(false);
                setOpenOnlyInChord(false);
                return;
              }
              if (nextMode === "all") {
                setShowOpen(true);
                setOpenOnlyInScale(false);
                setOpenOnlyInChord(false);
                return;
              }
              if (nextMode === "scale") {
                setShowOpen(true);
                setOpenOnlyInScale(true);
                setOpenOnlyInChord(false);
                return;
              }
              setShowOpen(true);
              setOpenOnlyInScale(false);
              setOpenOnlyInChord(true);
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "all", label: "All strings" },
              { value: "scale", label: "Current scale" },
              { value: "chord", label: "Current chord" },
            ]}
          />
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
    openOnlyInChord: s.openOnlyInChord,
    accidental: s.accidental,
    noteNaming: s.noteNaming,
    microLabelStyle: s.microLabelStyle,
    colorByDegree: s.colorByDegree,
    colorByShape: s.colorByShape,
    lefty: s.lefty,
    degreeCount: m.degreeCount,
    setShow: a.setShow,
    setShowOpen: a.setShowOpen,
    setShowFretNums: a.setShowFretNums,
    setDotSize: a.setDotSize,
    setOpenOnlyInScale: a.setOpenOnlyInScale,
    setOpenOnlyInChord: a.setOpenOnlyInChord,
    setAccidental: a.setAccidental,
    setNoteNaming: a.setNoteNaming,
    setMicroLabelStyle: a.setMicroLabelStyle,
    setColorByDegree: a.setColorByDegree,
    setColorByShape: a.setColorByShape,
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
