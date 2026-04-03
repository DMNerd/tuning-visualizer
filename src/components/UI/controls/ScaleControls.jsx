import React from "react";
import clsx from "clsx";
import { FiShuffle, FiRotateCcw } from "react-icons/fi";
import Section from "@/components/UI/Section";
import { memoWithKeys } from "@/utils/memo";
import ScalePicker from "@/components/UI/combobox/ScalePicker";
import { RANDOMIZE_MODES } from "@/hooks/useRandomScale";

function ScaleControls({
  root,
  setRoot,
  scale,
  setScale,
  sysNames,
  scaleOptions,
  defaultRoot = "C",
  defaultScale,
  randomizeMode = RANDOMIZE_MODES.Both,
  setRandomizeMode = () => {},
  onRandomize = () => {},
}) {
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

  return (
    <Section title="Scale" size="sm" className="tv-panel--scale-controls">
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

        <div className="tv-field">
          <label className="tv-field__label" htmlFor="scale-randomize-mode">
            Randomize
          </label>
          <select
            id="scale-randomize-mode"
            name="scale-randomize-mode"
            value={randomizeMode}
            onChange={(e) => setRandomizeMode(e.target.value)}
          >
            <option value={RANDOMIZE_MODES.Both}>Key + scale</option>
            <option value={RANDOMIZE_MODES.ScaleOnly}>Scale only</option>
            <option value={RANDOMIZE_MODES.KeyOnly}>Key only</option>
          </select>
        </div>
      </div>
    </Section>
  );
}

// React Profiler note: props are already top-level fields, so key-based
// identity checks are cheaper and clearer than deep structural `dequal`.
const ScaleControlsMemo = memoWithKeys(ScaleControls, [
  "root",
  "setRoot",
  "scale",
  "setScale",
  "sysNames",
  "scaleOptions",
  "defaultRoot",
  "defaultScale",
  "randomizeMode",
  "setRandomizeMode",
  "onRandomize",
]);

export default ScaleControlsMemo;
