import React from "react";
import clsx from "clsx";
import { FiShuffle, FiRotateCcw } from "react-icons/fi";
import Section from "@/components/UI/Section";
import { memoWithKeys } from "@/utils/memo";
import ScalePicker from "@/components/UI/combobox/ScalePicker";
import { RANDOMIZE_MODES } from "@/hooks/useRandomScale";
import SegmentedRadioGroup from "@/components/UI/SegmentedRadioGroup";

function ScaleControls({ state, actions, meta }) {
  const {
    root,
    scale,
    randomizeMode = RANDOMIZE_MODES.Both,
    defaultRoot = "C",
    defaultScale,
  } = state;
  const { setRoot, setScale, setRandomizeMode, onRandomize } = actions;
  const {
    sysNames,
    scaleOptions,
    scaleTonePcs = [],
    scaleToneLabels = [],
    chordTonePcs = null,
  } = meta;

  const resolvedDefaultScale = React.useMemo(() => {
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

  const rootInputId = React.useId();
  const rootLabelId = React.useId();
  const scaleInputId = React.useId();
  const scaleLabelId = React.useId();
  const scaleTonesLabelId = React.useId();

  return (
    <Section
      id="scale-controls"
      title="Scale"
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
            Root
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
            Scale
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
              aria-label="Apply randomization based on selected randomize mode"
              title="Randomize"
              onClick={onRandomize}
            >
              <FiShuffle size={16} aria-hidden />
            </button>
            <button
              type="button"
              className="tv-button tv-button--icon"
              aria-label="Reset to default scale and root"
              title="Reset to default"
              onClick={resetDefaults}
            >
              <FiRotateCcw size={16} aria-hidden />
            </button>
          </div>
        </div>

        <div className="tv-field tv-field--scale-tones">
          <span className="tv-field__label" id={scaleTonesLabelId}>
            Scale tones
          </span>
          <div
            className="tv-tone-list"
            aria-label="Scale tones"
            aria-labelledby={scaleTonesLabelId}
            role="list"
          >
            {scaleToneLabels.map((toneLabel, index) => (
              <div
                key={`${scaleTonePcs[index] ?? toneLabel}-${index}`}
                className="tv-tone-list__item"
                role="listitem"
              >
                <span
                  className={clsx("tv-tone-chip", {
                    "tv-tone-chip--in-chord":
                      chordTonePcs instanceof Set &&
                      chordTonePcs.has(scaleTonePcs[index]),
                  })}
                >
                  {toneLabel}
                </span>
                <span className="tv-tone-degree">{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <SegmentedRadioGroup
          className="tv-field--scale-tones"
          label="Randomize"
          name="scale-randomize-mode"
          value={randomizeMode}
          onChange={setRandomizeMode}
          options={[
            { value: RANDOMIZE_MODES.Both, label: "Key + scale" },
            { value: RANDOMIZE_MODES.ScaleOnly, label: "Scale only" },
            { value: RANDOMIZE_MODES.KeyOnly, label: "Key only" },
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
