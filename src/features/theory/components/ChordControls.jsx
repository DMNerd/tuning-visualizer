import { memo, useId, useMemo } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { chordLabel, chordTypesFor } from "@domain/theory/chords";
import { FiRotateCcw } from "react-icons/fi";
import { ascendingFrequencies } from "@domain/theory/playback";
import { playTones } from "@shared/lib/audio/tonePlayer";
import {
  arrayRefAndLengthEqual,
  keysIdentical,
  objectRefAndKeyEqual,
  setRefAndSizeEqual,
} from "@shared/lib/memo";
import { useScaleAndChord } from "@features/theory/hooks/useScaleAndChord";
import { ROOT_DEFAULT, CHORD_DEFAULT } from "@shared/config/appDefaults";
import ChordTypePicker from "@features/theory/components/ChordTypePicker";
import {
  CapoChordField,
  ChordToneField,
} from "@features/theory/components/ChordToneFields";
import SegmentedRadioGroup from "@shared/ui/SegmentedRadioGroup";
import ToggleSwitch from "@shared/ui/ToggleSwitch";
import { buildCapoChordDisplay } from "@features/theory/model/chordCapoDisplay";
import {
  buildChordTones,
  buildChordSummary,
} from "@features/theory/model/chordToneAnalysis";

// Overlay mode -> [showChord, hideNonChord].
const OVERLAY_MODE_FLAGS = {
  off: [false, false],
  overlay: [true, false],
  "chord-only": [true, true],
};

function ChordControls({ state, actions, meta }) {
  const { t } = useTranslation();
  const {
    root,
    type,
    showChord,
    hideNonChord,
    chordCapoRelative = false,
    chordIgnoresScale = false,
    defaultRoot = ROOT_DEFAULT,
    defaultType = CHORD_DEFAULT,
  } = state;
  const {
    onRootChange,
    onTypeChange,
    setShowChord,
    setHideNonChord,
    setChordCapoRelative,
    setChordIgnoresScale,
  } = actions;
  const {
    sysNames,
    nameForPc = null,
    system,
    rootIx,
    intervals,
    chordTonePcs,
    chordOverlayPcs,
    chordRootPc,
    capoFret = 0,
    originalChordRoot = root,
    transposedChordRoot = root,
    isChordTransposed = false,
    chordFit = null,
  } = meta;

  const resetDefaults = () => {
    onRootChange(defaultRoot);
    onTypeChange(defaultType);
    setShowChord(false);
    setHideNonChord(false);
    setChordCapoRelative?.(false);
    setChordIgnoresScale?.(false);
  };

  const divisions = system?.divisions ?? 12;

  const chordTypes = useMemo(() => chordTypesFor(divisions), [divisions]);
  const chordLabels = useMemo(
    () =>
      Object.fromEntries(
        chordTypes.map((chordType) => [
          chordType,
          chordLabel(chordType, divisions),
        ]),
      ),
    [chordTypes, divisions],
  );

  const safeIntervals = Array.isArray(intervals) ? intervals : [];

  const { scaleSet, degreeForPc } = useScaleAndChord({
    system,
    rootIx: typeof rootIx === "number" ? rootIx : 0,
    intervals: safeIntervals,
    chordPCs: chordTonePcs,
    chordRootPc,
  });

  const chordTones = useMemo(
    () =>
      buildChordTones({
        chordTonePcs,
        chordRootPc,
        rootIx,
        divisions: system?.divisions,
        nameForPc,
        degreeForPc,
        scaleSet,
      }),
    [
      chordTonePcs,
      chordRootPc,
      degreeForPc,
      nameForPc,
      rootIx,
      scaleSet,
      system?.divisions,
    ],
  );

  const chordSummary = useMemo(
    () => buildChordSummary({ showChord, chordTones, scaleSet, t }),
    [chordTones, scaleSet, showChord, t],
  );

  const rootInputId = useId();
  const rootLabelId = useId();
  const typeInputId = useId();
  const typeLabelId = useId();
  const capoRelativeId = useId();
  const ignoresScaleId = useId();
  const chordTypeLabel = chordLabels[type] ?? chordLabel(type, divisions);

  const playTone = (pc) =>
    playTones(ascendingFrequencies([pc], divisions, system?.refFreq));
  const capoChordDisplay = buildCapoChordDisplay({
    chordCapoRelative,
    capoFret,
    isChordTransposed,
    originalChordRoot,
    transposedChordRoot,
    root,
    chordTypeLabel,
    t,
  });

  const chordOverlayMode = !showChord
    ? "off"
    : hideNonChord
      ? "chord-only"
      : "overlay";

  return (
    <div className={clsx("tv-controls", "tv-controls--chord")}>
      <div className="tv-controls__grid--two">
        <div className="tv-field">
          <label
            className="tv-field__label"
            htmlFor={rootInputId}
            id={rootLabelId}
          >
            {t("theory.root")}
          </label>
          <select
            id={rootInputId}
            name="chord-root"
            value={root}
            aria-labelledby={rootLabelId}
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
          <label
            className="tv-field__label"
            htmlFor={typeInputId}
            id={typeLabelId}
          >
            {t("theory.chordType")}
          </label>
          <div className="tv-controls__input-row">
            <ChordTypePicker
              id={typeInputId}
              chordTypes={chordTypes}
              labels={chordLabels}
              selectedType={type}
              onSelect={onTypeChange}
              ariaLabelledBy={typeLabelId}
            />
            <button
              type="button"
              className="tv-button tv-button--icon"
              aria-label={t("theory.resetChordAria")}
              title={t("theory.resetDefault")}
              onClick={resetDefaults}
            >
              <FiRotateCcw size={16} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className="tv-field">
        <ToggleSwitch
          id={capoRelativeId}
          name="chord-capo-relative"
          checked={Boolean(chordCapoRelative)}
          onChange={(e) => setChordCapoRelative?.(e.target.checked)}
        >
          {t("theory.capoRelative")}
        </ToggleSwitch>
        <small className="tv-field__help">{capoChordDisplay.helpText}</small>
      </div>

      {chordCapoRelative ? <CapoChordField display={capoChordDisplay} /> : null}

      <ChordToneField
        chordTones={chordTones}
        chordSummary={chordSummary}
        showChord={showChord}
        chordOverlayPcs={chordOverlayPcs}
        onPlayTone={playTone}
      />

      <SegmentedRadioGroup
        label={t("theory.chordOverlay")}
        name="chord-overlay-mode"
        value={chordOverlayMode}
        onChange={(mode) => {
          const [nextShowChord, nextHideNonChord] =
            OVERLAY_MODE_FLAGS[mode] ?? OVERLAY_MODE_FLAGS["chord-only"];
          setShowChord(nextShowChord);
          setHideNonChord(nextHideNonChord);
        }}
        options={[
          { value: "off", label: t("common.off") },
          { value: "overlay", label: t("theory.overlay") },
          { value: "chord-only", label: t("theory.chordTonesOnly") },
        ]}
      />
      {chordOverlayMode === "chord-only" ? (
        <div className="tv-field">
          <ToggleSwitch
            id={ignoresScaleId}
            name="chord-ignores-scale"
            checked={Boolean(chordIgnoresScale)}
            onChange={(e) => setChordIgnoresScale?.(e.target.checked)}
          >
            {t("theory.ignoresScale")}
          </ToggleSwitch>
          <small className="tv-field__help">
            {t("theory.ignoresScaleHelp")}
          </small>
        </div>
      ) : null}
      {chordFit?.text ? (
        <small
          className={clsx("tv-fit-indicator", {
            "is-warning": chordFit.kind === "warning",
            "is-success": chordFit.kind === "success",
          })}
        >
          {chordFit.text}
        </small>
      ) : null}
    </div>
  );
}

const STATE_KEYS = [
  "root",
  "type",
  "showChord",
  "hideNonChord",
  "chordCapoRelative",
  "chordIgnoresScale",
  "defaultRoot",
  "defaultType",
];
const ACTION_KEYS = [
  "onRootChange",
  "onTypeChange",
  "setShowChord",
  "setHideNonChord",
  "setChordCapoRelative",
  "setChordIgnoresScale",
];
const META_IDENTITY_KEYS = [
  "sysNames",
  "nameForPc",
  "rootIx",
  "chordRootPc",
  "capoFret",
  "originalChordRoot",
  "transposedChordRoot",
  "isChordTransposed",
  "chordFit",
];

function areChordControlsPropsEqual(prev, next) {
  const prevMeta = prev.meta ?? {};
  const nextMeta = next.meta ?? {};
  return (
    keysIdentical(prev.state, next.state, STATE_KEYS) &&
    keysIdentical(prev.actions, next.actions, ACTION_KEYS) &&
    keysIdentical(prevMeta, nextMeta, META_IDENTITY_KEYS) &&
    objectRefAndKeyEqual(prevMeta.system, nextMeta.system, "id") &&
    objectRefAndKeyEqual(prevMeta.system, nextMeta.system, "divisions") &&
    arrayRefAndLengthEqual(prevMeta.intervals, nextMeta.intervals) &&
    setRefAndSizeEqual(prevMeta.chordTonePcs, nextMeta.chordTonePcs) &&
    setRefAndSizeEqual(prevMeta.chordOverlayPcs, nextMeta.chordOverlayPcs)
  );
}

// Comparator strategy: shallow/reference-first checks keep comparator cost low.
// Upstream should keep stable references for system/interval/chord set props.
const ChordControlsMemo = memo(ChordControls, areChordControlsPropsEqual);

export default ChordControlsMemo;
