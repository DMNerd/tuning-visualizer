import Section from "@/components/UI/Section";

export default function ScaleControls({
  root,
  setRoot,
  scale,
  setScale,
  sysNames,
  scaleOptions,
}) {
  return (
    <Section title="Scale">
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
