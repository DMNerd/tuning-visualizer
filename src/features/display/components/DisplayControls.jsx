import { useId } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  if (!Number.isFinite(k) || k < 1) return null;

  return (
    <div className="tv-legend" aria-live="polite">
      <p>
        <FiInfo className="tv-legend__info-icon" aria-hidden="true" />
        <span>{t("display.degreePalette")}</span>
      </p>
      <div className="tv-legend__swatches">
        {Array.from({ length: k }, (_, i) => {
          const degree = i + 1;
          const color = getDegreeColor(degree, k);
          return (
            <div
              className="tv-legend__swatch"
              key={degree}
              title={t("display.degree", { degree })}
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
      <small>{t("display.degreeLegendNote")}</small>
    </div>
  );
}

function ShapeLegend({ count = 5 }) {
  const { t } = useTranslation();
  if (!Number.isFinite(count) || count < 1) return null;

  return (
    <div className="tv-legend" aria-live="polite">
      <p>
        <FiInfo className="tv-legend__info-icon" aria-hidden="true" />
        <span>{t("display.shapePalette")}</span>
      </p>
      <div className="tv-legend__swatches">
        {Array.from({ length: count }, (_, i) => (
          <div
            className="tv-legend__swatch"
            key={i}
            title={t("display.shape", { shape: i + 1 })}
          >
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
      <small>{t("display.shapeLegendNote")}</small>
    </div>
  );
}

function DisplayControls({ state, actions, meta }) {
  const { t } = useTranslation();
  const {
    show,
    showOpen,
    showFretNums,
    dotSize,
    openOnlyInMode,
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
    setOpenOnlyInMode,
    setAccidental,
    setNoteNaming,
    setMicroLabelStyle,
    setColorByDegree,
    setColorByShape,
    setLefty,
  } = actions;
  const degreeCount = meta?.degreeCount ?? 7;
  const openNotesMode =
    showOpen === false
      ? "off"
      : openOnlyInMode === "chord"
        ? "chord"
        : openOnlyInMode === "scale"
          ? "scale"
          : "all";
  const labelsInputId = useId();
  const labelsFieldLabelId = useId();
  const dotSizeInputId = useId();
  const dotSizeLabelId = useId();

  return (
    <Section id="display-controls" title={t("display.title")}>
      <div className={clsx("tv-controls", "tv-controls--display")}>
        <div
          className="tv-controls__group"
          role="region"
          aria-label={t("display.notation")}
        >
          <SegmentedRadioGroup
            label={t("display.accidentals")}
            name="accidental"
            value={accidental}
            onChange={setAccidental}
            options={[
              { value: "sharp", label: t("display.accidentalSharp") },
              { value: "flat", label: t("display.accidentalFlat") },
              { value: "both", label: t("display.accidentalBoth") },
            ]}
          />

          <SegmentedRadioGroup
            label={t("display.noteNaming")}
            name="noteNaming"
            value={noteNaming}
            onChange={setNoteNaming}
            options={[
              { value: "english", label: t("display.namingEnglish") },
              { value: "german", label: t("display.namingGerman") },
            ]}
          />

          <div className="tv-field">
            <label
              className="tv-field__label"
              htmlFor={labelsInputId}
              id={labelsFieldLabelId}
            >
              {t("display.labels")}
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
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <SegmentedRadioGroup
            label={t("display.microLabels")}
            name="microLabelStyle"
            value={microLabelStyle}
            onChange={setMicroLabelStyle}
            options={[
              {
                value: MICRO_LABEL_STYLES.Letters,
                label: t("display.microLetters"),
              },
              {
                value: MICRO_LABEL_STYLES.Accidentals,
                label: t("display.microAccidentals"),
              },
              {
                value: MICRO_LABEL_STYLES.Fractions,
                label: t("display.microFractions"),
              },
            ]}
          />

          <SegmentedRadioGroup
            label={t("display.noteColors")}
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
              { value: "off", label: t("common.off") },
              { value: "degree", label: t("display.colorDegree") },
              { value: "shape", label: t("display.colorShape") },
            ]}
          />

          {colorByDegree ? <DegreeLegend k={degreeCount} /> : null}
          {colorByShape ? <ShapeLegend /> : null}
        </div>

        <div
          className="tv-controls__group"
          role="region"
          aria-label={t("display.openStrings")}
        >
          <SegmentedRadioGroup
            label={t("display.openNotes")}
            name="open-notes-mode"
            value={openNotesMode}
            onChange={(nextMode) => {
              setShowOpen(nextMode !== "off");
              setOpenOnlyInMode(
                nextMode === "scale" || nextMode === "chord"
                  ? nextMode
                  : "none",
              );
            }}
            options={[
              { value: "off", label: t("common.off") },
              { value: "all", label: t("display.openAll") },
              { value: "scale", label: t("display.openScale") },
              { value: "chord", label: t("display.openChord") },
            ]}
          />
        </div>

        <div
          className="tv-controls__group"
          role="region"
          aria-label={t("display.markersAndSizing")}
        >
          <ToggleSwitch
            id="showFretNums"
            name="showFretNums"
            checked={showFretNums}
            onChange={(e) => setShowFretNums(e.target.checked)}
          >
            {t("display.showFretNumbers")}
          </ToggleSwitch>

          <div className="tv-field">
            <label
              className="tv-field__label"
              htmlFor={dotSizeInputId}
              id={dotSizeLabelId}
            >
              {t("display.dotSize")}
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
            {t("display.lefty")}
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
    openOnlyInMode: s.openOnlyInMode,
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
    setOpenOnlyInMode: a.setOpenOnlyInMode,
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
