import React from "react";
import { dequal } from "dequal";
import Section from "@/components/UI/Section";

function ScaleControls({
  root,
  setRoot,
  scale,
  setScale,
  sysNames,
  scaleOptions,
}) {
  return (
    <Section title="Scale" size="sm">
      <div className="grid2">
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
