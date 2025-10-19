import React from "react";
import { dequal } from "dequal";
import Section from "@/components/UI/Section";

const CUSTOM_SYSTEM_ID = "custom";

function TuningSystemSelector({
  systemId,
  setSystemId,
  systems,
  customDivisor,
  onCustomDivisorChange,
}) {
  const handleCustomDivisorChange = (event) => {
    const { value } = event.target;
    if (value === "") {
      onCustomDivisorChange("");
      return;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;

    const sanitized = Math.max(1, Math.round(parsed));
    onCustomDivisorChange(String(sanitized));
  };

  return (
    <Section title="Tuning System" size="sm">
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
          <option value={CUSTOM_SYSTEM_ID}>
            {customDivisor ? `Custom (${customDivisor}-TET)` : "Custom"}
          </option>
        </select>
      </div>
      {systemId === CUSTOM_SYSTEM_ID ? (
        <div className="field">
          <span>Divisions</span>
          <input
            id="custom-tuning-divisor"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={customDivisor ?? ""}
            onChange={handleCustomDivisorChange}
          />
        </div>
      ) : null}
    </Section>
  );
}

function pick(p) {
  return {
    systemId: p.systemId,
    systems: p.systems,
    customDivisor: p.customDivisor,
  };
}
export default React.memo(TuningSystemSelector, (a, b) =>
  dequal(pick(a), pick(b)),
);
