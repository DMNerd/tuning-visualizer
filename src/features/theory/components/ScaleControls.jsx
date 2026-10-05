import { useId, useMemo } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { FiShuffle, FiRotateCcw } from "react-icons/fi";
import {
  ascendingFrequencies,
  chordFrequencies,
} from "@domain/theory/playback";
import { buildChordPCsFromPc } from "@domain/theory/chords";
import { playTones } from "@shared/lib/audio/tonePlayer";
import Section from "@shared/ui/Section";
import { memoWithKeys } from "@shared/lib/memo";
import ScalePicker from "@features/theory/components/ScalePicker";
import { RANDOMIZE_MODES } from "@features/theory/hooks/useRandomScale";
import SegmentedRadioGroup from "@shared/ui/SegmentedRadioGroup";

function ScaleControls({ state, actions, meta }) {
  const { t } = useTranslation();
  const {
    root,
    scale,
    randomizeMode = RANDOMIZE_MODES.Both,
    defaultRoot = "C",
    defaultScale,
  } = state;
  const { setRoot, setScale, setRandomizeMode, onRandomize, showChord } =
    actions;
  const {
    sysNames,
    scaleOptions,
    scaleTonePcs = [],
    scaleToneLabels = [],
    chordTonePcs = null,
    scaleChords = [],
    scaleModes = [],
    nameForPc = (pc) => String(pc),
    divisions = 12,
    refFreq = 440,
  } = meta;

  const playTone = (pc) =>
    playTones(ascendingFrequencies([pc], divisions, refFreq));
  // loading a chord of the scale also plays it
  const loadChord = (rootPc, type) => {
    showChord?.(rootPc, type);
    playTones(
      chordFrequencies(
        rootPc,
        buildChordPCsFromPc(rootPc, type, divisions),
        divisions,
        refFreq,
      ),
      { together: true },
    );
  };
  const chordSymbol = (rootPc, type) =>
    `${nameForPc(rootPc)}${type === "M" ? "" : type}`;
  // each degree's main chord (with its numeral), then the others
  const mainChords = scaleChords.flatMap(
    ({ degree, numeral, rootPc, types }) =>
      types.length > 0 ? [{ degree, numeral, rootPc, type: types[0] }] : [],
  );
  const otherChords = scaleChords.flatMap(({ degree, rootPc, types }) =>
    types.slice(1).map((type) => ({ degree, rootPc, type })),
  );
  const chordChip = (rootPc, type) => {
    const symbol = chordSymbol(rootPc, type);
    return (
      <button
        type="button"
        className={clsx(
          "tv-tone-chip",
          "tv-tone-chip--button",
          "tv-tone-chip--load",
        )}
        onClick={() => loadChord(rootPc, type)}
        aria-label={t("theory.showChordAria", { chord: symbol })}
      >
        {symbol}
      </button>
    );
  };

  const resolvedDefaultScale = useMemo(() => {
    if (
      defaultScale &&
      Array.isArray(scaleOptions) &&
      scaleOptions.some((option) => option.label === defaultScale)
    ) {
      return defaultScale;
    }

    return scaleOptions?.[0]?.label ?? "";
  }, [defaultScale, scaleOptions]);

  const resetDefaults = () => {
    setRoot(defaultRoot);
    if (resolvedDefaultScale) setScale(resolvedDefaultScale);
  };

  const rootInputId = useId();
  const rootLabelId = useId();
  const scaleInputId = useId();
  const scaleLabelId = useId();
  const scaleTonesLabelId = useId();

  return (
    <Section
      id="scale-controls"
      title={t("theory.scaleTitle")}
      size="sm"
      className="tv-panel--scale-controls"
    >
      <div className={clsx("tv-controls", "tv-controls--scale")}>
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
            name="root"
            value={root}
            onChange={(e) => setRoot(e.target.value)}
          >
            {sysNames.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="tv-field">
          <label
            className="tv-field__label"
            htmlFor={scaleInputId}
            id={scaleLabelId}
          >
            {t("theory.scale")}
          </label>
          <div className="tv-controls__input-row">
            <ScalePicker
              id={scaleInputId}
              aria-labelledby={scaleLabelId}
              scale={scale}
              setScale={setScale}
              scaleOptions={scaleOptions}
            />
            <button
              type="button"
              className="tv-button tv-button--icon"
              aria-label={t("theory.randomizeAria")}
              title={t("theory.randomize")}
              onClick={onRandomize}
            >
              <FiShuffle size={16} aria-hidden />
            </button>
            <button
              type="button"
              className="tv-button tv-button--icon"
              aria-label={t("theory.resetScaleAria")}
              title={t("theory.resetDefault")}
              onClick={resetDefaults}
            >
              <FiRotateCcw size={16} aria-hidden />
            </button>
          </div>
        </div>

        <div className="tv-field tv-field--scale-tones">
          <span className="tv-field__label" id={scaleTonesLabelId}>
            {t("theory.scaleTones")}
          </span>
          <div
            className="tv-tone-list"
            aria-label={t("theory.scaleTones")}
            aria-labelledby={scaleTonesLabelId}
            role="list"
          >
            {scaleToneLabels.map((toneLabel, index) => (
              <div
                // eslint-disable-next-line @eslint-react/no-array-index-key -- tones are identified by scale degree
                key={`${scaleTonePcs[index] ?? toneLabel}-${index}`}
                className="tv-tone-list__item"
                role="listitem"
              >
                <button
                  type="button"
                  className={clsx(
                    "tv-tone-chip",
                    "tv-tone-chip--button",
                    "tv-tone-chip--load",
                    {
                      "tv-tone-chip--in-chord":
                        chordTonePcs instanceof Set &&
                        chordTonePcs.has(scaleTonePcs[index]),
                    },
                  )}
                  title={t("theory.clickToPlay")}
                  onClick={() => playTone(scaleTonePcs[index])}
                >
                  {toneLabel}
                </button>
                <span className="tv-tone-degree">{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {scaleModes.length > 0 ? (
          <div className="tv-field tv-field--scale-tones">
            <span className="tv-field__label">{t("theory.modes")}</span>
            <div
              className="tv-tone-list"
              role="list"
              aria-label={t("theory.modes")}
            >
              {scaleModes.map(({ rootPc, label }) => {
                const mode = `${nameForPc(rootPc)} ${label}`;
                return (
                  <div
                    key={`${rootPc}-${label}`}
                    className="tv-tone-list__item"
                    role="listitem"
                  >
                    <button
                      type="button"
                      className={clsx(
                        "tv-tone-chip",
                        "tv-tone-chip--button",
                        "tv-tone-chip--load",
                      )}
                      onClick={() => {
                        setRoot(nameForPc(rootPc));
                        setScale(label);
                      }}
                      aria-label={t("theory.showModeAria", { scale: mode })}
                    >
                      {mode}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {mainChords.length > 0 ? (
          <div className="tv-field tv-field--scale-tones">
            <span className="tv-field__label">{t("theory.scaleChords")}</span>
            <div
              className="tv-tone-list"
              role="list"
              aria-label={t("theory.scaleChords")}
            >
              {mainChords.map(({ degree, numeral, rootPc, type }) => (
                <div
                  key={degree}
                  className="tv-tone-list__item"
                  role="listitem"
                >
                  {chordChip(rootPc, type)}
                  <span className="tv-tone-degree">{numeral}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {otherChords.length > 0 ? (
          <div className="tv-field tv-field--scale-tones">
            <span className="tv-field__label">
              {t("theory.scaleChordsOther")}
            </span>
            <div
              className="tv-tone-list"
              role="list"
              aria-label={t("theory.scaleChordsOther")}
            >
              {otherChords.map(({ degree, rootPc, type }) => (
                <div
                  key={`${degree}-${type}`}
                  className="tv-tone-list__item"
                  role="listitem"
                >
                  {chordChip(rootPc, type)}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <SegmentedRadioGroup
          className="tv-field--scale-tones"
          label={t("theory.randomize")}
          name="scale-randomize-mode"
          value={randomizeMode}
          onChange={setRandomizeMode}
          options={[
            { value: RANDOMIZE_MODES.Both, label: t("theory.randomizeBoth") },
            {
              value: RANDOMIZE_MODES.ScaleOnly,
              label: t("theory.randomizeScaleOnly"),
            },
            {
              value: RANDOMIZE_MODES.KeyOnly,
              label: t("theory.randomizeKeyOnly"),
            },
          ]}
        />
      </div>
    </Section>
  );
}

// React Profiler note: props are already top-level fields, so key-based
// identity checks are cheaper and clearer than deep structural `dequal`.
const ScaleControlsMemo = memoWithKeys(ScaleControls, [
  "state",
  "actions",
  "meta",
]);

export default ScaleControlsMemo;
