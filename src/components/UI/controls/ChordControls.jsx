import { memo, useId, useMemo } from "react";
import clsx from "clsx";
import Section from "@/components/UI/Section";
import {
  CHORD_TYPES,
  CHORD_LABELS,
  STANDARD_CHORD_TYPES,
} from "@/lib/theory/chords";
import { FiRotateCcw } from "react-icons/fi";
import {
  arrayRefAndLengthEqual,
  objectRefAndKeyEqual,
  setRefAndSizeEqual,
} from "@/utils/memo";
import { useScaleAndChord } from "@/hooks/useScaleAndChord";
import { ROOT_DEFAULT, CHORD_DEFAULT } from "@/lib/config/appDefaults";
import ChordTypePicker from "@/components/UI/combobox/ChordTypePicker";
import SegmentedRadioGroup from "@/components/UI/SegmentedRadioGroup";

function ChordControls({ state, actions, meta }) {
  const {
    root,
    type,
    showChord,
    hideNonChord,
    defaultRoot = ROOT_DEFAULT,
    defaultType = CHORD_DEFAULT,
  } = state;
  const { onRootChange, onTypeChange, setShowChord, setHideNonChord } = actions;
  const {
    sysNames,
    nameForPc = null,
    supportsMicrotonal = false,
    system,
    rootIx,
    intervals,
    chordTonePcs,
    chordOverlayPcs,
    chordRootPc,
    chordFit = null,
  } = meta;

  const resetDefaults = () => {
    onRootChange(defaultRoot);
    onTypeChange(defaultType);
    setShowChord(false);
    setHideNonChord(false);
  };

  const divisions = Number(system?.divisions);
  const allowMicrotonal =
    Boolean(supportsMicrotonal) && Number.isFinite(divisions) && divisions > 12;

  const chordTypes = allowMicrotonal ? CHORD_TYPES : STANDARD_CHORD_TYPES;

  const safeIntervals = Array.isArray(intervals) ? intervals : [];

  const { scaleSet, degreeForPc } = useScaleAndChord({
    system,
    rootIx: typeof rootIx === "number" ? rootIx : 0,
    intervals: safeIntervals,
    chordPCs: chordTonePcs,
    chordRootPc,
  });

  const chordTones = useMemo(() => {
    if (!chordTonePcs || chordTonePcs.size === 0) return [];
    if (!system?.divisions) return [];

    const totalDivisions = system.divisions;
    const anchorRaw = Number.isFinite(chordRootPc)
      ? chordRootPc
      : Number.isFinite(rootIx)
        ? rootIx
        : 0;
    const anchor =
      ((anchorRaw % totalDivisions) + totalDivisions) % totalDivisions;

    const pcs = Array.from(chordTonePcs, (value) => {
      const wrapped =
        ((value % totalDivisions) + totalDivisions) % totalDivisions;
      return wrapped;
    });

    pcs.sort((a, b) => {
      const da = (a - anchor + totalDivisions) % totalDivisions;
      const db = (b - anchor + totalDivisions) % totalDivisions;
      return da - db;
    });

    return pcs.map((pc) => {
      const noteName = nameForPc?.(pc) ?? String(pc);
      const degree = degreeForPc(pc);
      const inScale = scaleSet.has(pc);
      return { pc, noteName, degree, inScale };
    });
  }, [
    chordTonePcs,
    chordRootPc,
    degreeForPc,
    nameForPc,
    rootIx,
    scaleSet,
    system?.divisions,
  ]);

  const chordSummary = useMemo(() => {
    if (!showChord) return null;
    if (!chordTones.length) return null;
    if (scaleSet.size === 0) {
      return {
        kind: "info",
        text: "Select a scale to analyse the chord.",
      };
    }

    const outside = chordTones.filter((tone) => !tone.inScale);
    if (outside.length > 0) {
      return {
        kind: "warning",
        text: `Outside selected scale: ${outside.map((tone) => tone.noteName).join(", ")}`,
      };
    }

    const degreeLabels = chordTones
      .map((tone) => (tone.degree != null ? String(tone.degree) : "–"))
      .join(", ");

    return {
      kind: "success",
      text: `All chord tones are in scale (degrees: ${degreeLabels}).`,
    };
  }, [chordTones, scaleSet, showChord]);

  const rootInputId = useId();
  const rootLabelId = useId();
  const typeInputId = useId();
  const typeLabelId = useId();
  const chordOverlayMode = !showChord
    ? "off"
    : hideNonChord
      ? "chord-only"
      : "overlay";

  return (
    <Section id="chord-controls" title="Chord Controls" size="sm">
      <div className={clsx("tv-controls", "tv-controls--chord")}>
        <div className="tv-controls__grid--two">
          <div className="tv-field">
            <label
              className="tv-field__label"
              htmlFor={rootInputId}
              id={rootLabelId}
            >
              Root
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
              Type
            </label>
            <div className="tv-controls__input-row">
              <ChordTypePicker
                id={typeInputId}
                chordTypes={chordTypes}
                labels={CHORD_LABELS}
                selectedType={type}
                onSelect={onTypeChange}
                supportsMicrotonal={supportsMicrotonal}
                ariaLabelledBy={typeLabelId}
              />
              <button
                type="button"
                className="tv-button tv-button--icon"
                aria-label="Reset chord controls to defaults"
                title="Reset to default"
                onClick={resetDefaults}
              >
                <FiRotateCcw size={16} aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <div className="tv-field tv-field--scale-tones">
          <span className="tv-field__label">Chord tones</span>
          {chordTones.length > 0 ? (
            <div
              className="tv-tone-list tv-tone-list--analysis"
              role="list"
              aria-label="Chord tones"
            >
              {chordTones.map((tone) => (
                <div
                  key={tone.pc}
                  className="tv-tone-list__item"
                  role="listitem"
                >
                  <span
                    className={clsx("tv-tone-chip", {
                      "tv-tone-chip--in-scale": showChord && tone.inScale,
                      "tv-tone-chip--outside": showChord && !tone.inScale,
                      "tv-tone-chip--in-chord":
                        chordOverlayPcs instanceof Set &&
                        chordOverlayPcs.has(tone.pc),
                    })}
                    aria-label={
                      showChord
                        ? `${tone.noteName}, ${
                            tone.inScale
                              ? `degree ${tone.degree ?? "unknown"} in selected scale`
                              : "outside selected scale"
                          }`
                        : `${tone.noteName}`
                    }
                  >
                    <span>{tone.noteName}</span>
                    {showChord ? (
                      <small className="tv-tone-chip__meta">
                        {tone.inScale ? `deg ${tone.degree ?? "–"}` : "outside"}
                      </small>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {chordSummary?.text ? (
            <small
              className={clsx("tv-field__help", {
                "tv-field__help--error": chordSummary.kind === "warning",
              })}
            >
              {chordSummary.text}
            </small>
          ) : null}
        </div>

        <SegmentedRadioGroup
          label="Chord overlay"
          name="chord-overlay-mode"
          value={chordOverlayMode}
          onChange={(mode) => {
            if (mode === "off") {
              setShowChord(false);
              setHideNonChord(false);
              return;
            }
            if (mode === "overlay") {
              setShowChord(true);
              setHideNonChord(false);
              return;
            }
            setShowChord(true);
            setHideNonChord(true);
          }}
          options={[
            { value: "off", label: "Off" },
            { value: "overlay", label: "Overlay" },
            { value: "chord-only", label: "Chord tones only" },
          ]}
        />
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
    </Section>
  );
}

function areChordControlsPropsEqual(prev, next) {
  const prevState = prev.state ?? {};
  const nextState = next.state ?? {};
  if (!Object.is(prevState.root, nextState.root)) return false;
  if (!Object.is(prevState.type, nextState.type)) return false;
  if (!Object.is(prevState.showChord, nextState.showChord)) return false;
  if (!Object.is(prevState.hideNonChord, nextState.hideNonChord)) return false;
  if (!Object.is(prevState.defaultRoot, nextState.defaultRoot)) return false;
  if (!Object.is(prevState.defaultType, nextState.defaultType)) return false;

  const prevActions = prev.actions ?? {};
  const nextActions = next.actions ?? {};
  if (!Object.is(prevActions.onRootChange, nextActions.onRootChange)) {
    return false;
  }
  if (!Object.is(prevActions.onTypeChange, nextActions.onTypeChange)) {
    return false;
  }
  if (!Object.is(prevActions.setShowChord, nextActions.setShowChord)) {
    return false;
  }
  if (!Object.is(prevActions.setHideNonChord, nextActions.setHideNonChord)) {
    return false;
  }

  const prevMeta = prev.meta ?? {};
  const nextMeta = next.meta ?? {};
  if (!Object.is(prevMeta.sysNames, nextMeta.sysNames)) return false;
  if (!Object.is(prevMeta.nameForPc, nextMeta.nameForPc)) return false;
  if (!Object.is(prevMeta.supportsMicrotonal, nextMeta.supportsMicrotonal)) {
    return false;
  }
  if (!objectRefAndKeyEqual(prevMeta.system, nextMeta.system, "id")) {
    return false;
  }
  if (!objectRefAndKeyEqual(prevMeta.system, nextMeta.system, "divisions")) {
    return false;
  }
  if (!Object.is(prevMeta.rootIx, nextMeta.rootIx)) return false;
  if (!arrayRefAndLengthEqual(prevMeta.intervals, nextMeta.intervals)) {
    return false;
  }
  if (!setRefAndSizeEqual(prevMeta.chordTonePcs, nextMeta.chordTonePcs)) {
    return false;
  }
  if (!setRefAndSizeEqual(prevMeta.chordOverlayPcs, nextMeta.chordOverlayPcs)) {
    return false;
  }
  if (!Object.is(prevMeta.chordRootPc, nextMeta.chordRootPc)) return false;
  if (!Object.is(prevMeta.chordFit, nextMeta.chordFit)) return false;

  return true;
}

// Comparator strategy: shallow/reference-first checks keep comparator cost low.
// Upstream should keep stable references for system/interval/chord set props.
const ChordControlsMemo = memo(ChordControls, areChordControlsPropsEqual);

export default ChordControlsMemo;
