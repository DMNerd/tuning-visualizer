import React from "react";
import { dequal } from "dequal";
import { FiShuffle, FiRotateCcw } from "react-icons/fi";
import Section from "@/components/UI/Section";

function ScaleControls({
  root,
  setRoot,
  scale,
  setScale,
  sysNames,
  scaleOptions,
  defaultRoot = "C",
  defaultScale = "Major",
}) {
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
    setScale(defaultScale);
  };

  return (
    <Section title="Scale" size="sm">
      <div className="scale-controls grid2">
        <div className="field">
          <span>Root</span>
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

        <div className="field">
          <span>Scale</span>
          <div className="input-row">
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
              className="icon-btn"
              aria-label="Pick a random root and scale"
              title="Random root & scale"
              onClick={pickRandom}
            >
              <FiShuffle size={16} aria-hidden />
            </button>
            <button
              type="button"
              className="icon-btn"
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

export default React.memo(ScaleControls, (a, b) => dequal(pick(a), pick(b)));
