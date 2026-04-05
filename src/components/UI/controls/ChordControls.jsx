import { useId, useMemo } from "react";
import clsx from "clsx";
import Section from "@/components/UI/Section";
import {
  CHORD_TYPES,
  CHORD_LABELS,
  STANDARD_CHORD_TYPES,
} from "@/lib/theory/chords";
import { FiRotateCcw } from "react-icons/fi";
import { memoWithPick } from "@/utils/memo";
import { useScaleAndChord } from "@/hooks/useScaleAndChord";
import { ROOT_DEFAULT, CHORD_DEFAULT } from "@/lib/config/appDefaults";
import ChordTypePicker from "@/components/UI/combobox/ChordTypePicker";
import ToggleSwitch from "@/components/UI/ToggleSwitch";

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
  const chordOverlayGroupLabelId = useId();
  const showChordInputId = useId();
  const hideNonChordInputId = useId();

  return (
    <Section id="chord-controls" title="Chord Controls" size="sm">
      <div className={clsx("tv-controls", "tv-controls--chord")}>
        <div className="tv-controls__grid--two">
          <div className="tv-field">
            <label className="tv-field__label" htmlFor={rootInputId} id={rootLabelId}>
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
            <label className="tv-field__label" htmlFor={typeInputId} id={typeLabelId}>
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

        <div className="tv-field">
          <span className="tv-field__label" id={chordOverlayGroupLabelId}>
            Chord overlay
          </span>
          <div
            className="tv-controls__radio-row"
            role="group"
            aria-labelledby={chordOverlayGroupLabelId}
            aria-disabled={!showChord}
          >
            <ToggleSwitch
              id={showChordInputId}
              name="showChord"
              checked={showChord}
              onChange={(e) => setShowChord(e.target.checked)}
            >
              Show chord
            </ToggleSwitch>

            <ToggleSwitch
              id={hideNonChordInputId}
              name="hideNonChord"
              checked={hideNonChord}
              onChange={(e) => setHideNonChord(e.target.checked)}
              disabled={!showChord}
            >
              Hide non-chord tones
            </ToggleSwitch>
          </div>
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
      </div>
    </Section>
  );
}

function pick(p) {
  const s = p.state ?? {};
  const a = p.actions ?? {};
  const m = p.meta ?? {};

  return {
    root: s.root,
    type: s.type,
    showChord: s.showChord,
    hideNonChord: s.hideNonChord,
    defaultRoot: s.defaultRoot,
    defaultType: s.defaultType,
    onRootChange: a.onRootChange,
    onTypeChange: a.onTypeChange,
    setShowChord: a.setShowChord,
    setHideNonChord: a.setHideNonChord,
    sysNames: m.sysNames,
    nameForPc: m.nameForPc,
    supportsMicrotonal: m.supportsMicrotonal,
    system: m.system,
    rootIx: m.rootIx,
    intervals: m.intervals,
    chordTonePcs: m.chordTonePcs,
    chordOverlayPcs: m.chordOverlayPcs,
    chordRootPc: m.chordRootPc,
    chordFit: m.chordFit,
  };
}

const ChordControlsMemo = memoWithPick(ChordControls, pick);

export default ChordControlsMemo;
