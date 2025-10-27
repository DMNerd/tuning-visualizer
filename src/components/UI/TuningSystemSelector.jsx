import React from "react";
import clsx from "clsx";
import Section from "@/components/UI/Section";
import { memoWithPick } from "@/utils/memo";

function TuningSystemSelector({ systemId, setSystemId, systems }) {
  return (
    <Section title="Tuning System" size="sm">
      <div className={clsx("tv-controls", "tv-controls--system")}>
        <div className="tv-field">
          <span className="tv-field__label">System</span>
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
const TuningSystemSelectorMemo = memoWithPick(TuningSystemSelector, pick);

export default TuningSystemSelectorMemo;
