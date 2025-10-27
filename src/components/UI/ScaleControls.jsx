import React from "react";
import clsx from "clsx";
import { FiShuffle, FiRotateCcw } from "react-icons/fi";
import Section from "@/components/UI/Section";
import { memoWithPick } from "@/utils/memo";

function ScaleControls({
  root,
  setRoot,
  scale,
  setScale,
  sysNames,
  scaleOptions,
  defaultRoot = "C",
  defaultScale,
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

  const pickRandom = () => {
    if (!Array.isArray(sysNames) || !sysNames.length) return;
    if (!Array.isArray(scaleOptions) || !scaleOptions.length) return;

    const nextRoot = sysNames[Math.floor(Math.random() * sysNames.length)];
    const nextScaleObj =
      scaleOptions[Math.floor(Math.random() * scaleOptions.length)];

    setRoot(nextRoot);
    setScale(nextScaleObj.label);
  };

  const resetDefaults = () => {
    setRoot(defaultRoot);
    if (resolvedDefaultScale) setScale(resolvedDefaultScale);
  };

  return (
    <Section title="Scale" size="sm" className="tv-panel--scale-controls">
      <div className={clsx("tv-controls", "tv-controls--scale")}>
        <div className="tv-field">
          <span className="tv-field__label">Root</span>
          <select
            id="root"
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
          <span className="tv-field__label">Scale</span>
          <div className="tv-controls__input-row">
            <select
              id="scale"
              name="scale"
              value={scale}
              onChange={(e) => setScale(e.target.value)}
            >
              {scaleOptions.map((s) => (
                <option key={s.label} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="tv-button tv-button--icon"
              aria-label="Pick a random root and scale"
              title="Random root & scale"
              onClick={pickRandom}
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
  };
}

const ScaleControlsMemo = memoWithPick(ScaleControls, pick);

export default ScaleControlsMemo;
