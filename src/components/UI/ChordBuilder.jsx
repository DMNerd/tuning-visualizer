import { useMemo } from "react";
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
  system,
  rootIx,
  intervals,
  chordPCs,
  chordRootPc,
}) {
  const resetDefaults = () => {
    onRootChange(defaultRoot);
    onTypeChange(defaultType);
    setShowChord(false);
    setHideNonChord(false);
  };

  const chordTypes = supportsMicrotonal ? CHORD_TYPES : STANDARD_CHORD_TYPES;

  const safeIntervals = Array.isArray(intervals) ? intervals : [];

  const { scaleSet, degreeForPc } = useScaleAndChord({
    system,
    rootIx: typeof rootIx === "number" ? rootIx : 0,
    intervals: safeIntervals,
    chordPCs,
    chordRootPc,
  });

  const chordSummary = useMemo(() => {
    if (!chordPCs || chordPCs.size === 0) return null;

    if (!system?.divisions) return null;

    if (scaleSet.size === 0) {
      return {
        kind: "info",
        text: "Select a scale to analyse the chord.",
      };
    }

    const divisions = system.divisions;
    const anchorRaw = Number.isFinite(chordRootPc)
      ? chordRootPc
      : Number.isFinite(rootIx)
        ? rootIx
        : 0;
    const anchor = ((anchorRaw % divisions) + divisions) % divisions;

    const pcs = Array.from(chordPCs, (value) => {
      const wrapped = ((value % divisions) + divisions) % divisions;
      return wrapped;
    });

    pcs.sort((a, b) => {
      const da = (a - anchor + divisions) % divisions;
      const db = (b - anchor + divisions) % divisions;
      return da - db;
    });

    const tones = pcs.map((pc) => {
      const noteName = sysNames?.[pc] ?? String(pc);
      const degree = degreeForPc(pc);
      const inScale = scaleSet.has(pc);
      return { noteName, degree, inScale };
    });

    const outside = tones.filter((tone) => !tone.inScale);
    if (outside.length > 0) {
      return {
        kind: "warning",
        text: `Chord tones outside current scale: ${outside
          .map((tone) => tone.noteName)
          .join(", ")}`,
      };
    }

    const degreeLabels = tones
      .map((tone) => (tone.degree != null ? String(tone.degree) : "–"))
      .join(", ");

    return {
      kind: "success",
      text: `Chord degrees in scale: ${degreeLabels}`,
    };
  }, [
    chordPCs,
    chordRootPc,
    degreeForPc,
    rootIx,
    scaleSet,
    sysNames,
    system?.divisions,
  ]);

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
            <label className="tv-check" htmlFor="showChord">
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
    system: p.system,
    rootIx: p.rootIx,
    intervals: p.intervals,
    chordPCs: p.chordPCs,
    chordRootPc: p.chordRootPc,
  };
}

const ChordBuilderMemo = memoWithPick(ChordBuilder, pick);

export default ChordBuilderMemo;
