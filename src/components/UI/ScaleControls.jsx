import React from "react";
import clsx from "clsx";
import { FiShuffle, FiRotateCcw } from "react-icons/fi";
import Section from "@/components/UI/Section";
import { memoWithPick } from "@/utils/memo";
import ScalePicker from "@/components/UI/combobox/ScalePicker";

function ScaleControls({
  root,
  setRoot,
  scale,
  setScale,
  sysNames,
  scaleOptions,
  defaultRoot = "C",
  defaultScale,
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
              aria-label="Pick a random root and scale"
              title="Random root & scale"
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
      </div>
    </Section>
  );
}

function pick(p) {
  return {
    root: p.root,
    scale: p.scale,
    sysNames: p.sysNames,
    scaleOptions: p.scaleOptions,
    defaultRoot: p.defaultRoot,
    defaultScale: p.defaultScale,
    onRandomize: p.onRandomize,
    setRoot: p.setRoot,
    setScale: p.setScale,
  };
}

const ScaleControlsMemo = memoWithPick(ScaleControls, pick);

export default ScaleControlsMemo;
