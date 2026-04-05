import { useId } from "react";
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
import SegmentedRadioGroup from "@/components/UI/SegmentedRadioGroup";

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
  const resolvedShowOpen = showOpen !== false;
  const resolvedOpenOnlyInScale = resolvedShowOpen && openOnlyInScale === true;
  const openNotesMode = !resolvedShowOpen
    ? "off"
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
        >
          <SegmentedRadioGroup
            label="Open notes"
            name="open-notes-mode"
            value={openNotesMode}
            onChange={(nextMode) => {
              if (nextMode === "off") {
                setShowOpen(false);
                setOpenOnlyInScale(false);
                return;
              }
              if (nextMode === "all") {
                setShowOpen(true);
                setOpenOnlyInScale(false);
                return;
              }
              setShowOpen(true);
              setOpenOnlyInScale(true);
            }}
            options={[
              { value: "off", label: "Off" },
              { value: "all", label: "All strings" },
              { value: "scale", label: "Current scale" },
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
