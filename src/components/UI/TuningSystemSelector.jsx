import React from "react";
import { dequal } from "dequal";
import clsx from "clsx";
import Section from "@/components/UI/Section";

function TuningSystemSelector({ systemId, setSystemId, systems }) {
  return (
    <Section title="Tuning System" size="sm">
      <div className={clsx("control-panel", "tuning-system-controls")}>
        <div className="field">
          <span>System</span>
          <select
            id="system"
            name="system"
            value={systemId}
            onChange={(e) => setSystemId(e.target.value)}
          >
            {Object.keys(systems).map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Section>
  );
}

function pick(p) {
  return { systemId: p.systemId, systems: p.systems };
}
export default React.memo(TuningSystemSelector, (a, b) =>
  dequal(pick(a), pick(b)),
);
