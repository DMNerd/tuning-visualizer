import React from "react";
import Section from "@/components/UI/Section";

function TuningSystemSelector({ systemId, setSystemId, systems }) {
  return (
    <Section title="Tuning System">
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
    </Section>
  );
}

export default React.memo(TuningSystemSelector);
