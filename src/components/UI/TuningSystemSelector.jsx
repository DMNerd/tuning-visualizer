import React, { useCallback, useEffect, useMemo, useState } from "react";
import { dequal } from "dequal";
import Section from "@/components/UI/Section";
import { CUSTOM_TET_MIN, CUSTOM_TET_MAX } from "@/lib/config/appDefaults";

const CUSTOM_SYSTEM_ID = "custom";

function TuningSystemSelector({
  systemId,
  setSystemId,
  systems,
  customDivisor,
  onCustomDivisorChange,
}) {
  const [draftDivisor, setDraftDivisor] = useState(() => customDivisor ?? "");
  const [divisorErr, setDivisorErr] = useState("");

  useEffect(() => {
    setDraftDivisor(customDivisor ?? "");
  }, [customDivisor]);

  const commitDivisor = useCallback(
    (rawOverride) => {
      const source =
        typeof rawOverride === "number" || typeof rawOverride === "string"
          ? rawOverride
          : draftDivisor;

      const text = typeof source === "string" ? source.trim() : String(source);

      if (text === "") {
        setDivisorErr(
          `Please enter a number between ${CUSTOM_TET_MIN} and ${CUSTOM_TET_MAX}.`,
        );
        return false;
      }

      const parsed = Number(text);
      if (!Number.isFinite(parsed)) {
        setDivisorErr(
          `Please enter a number between ${CUSTOM_TET_MIN} and ${CUSTOM_TET_MAX}.`,
        );
        return false;
      }

      const rounded = Math.round(parsed);
      const clamped = Math.min(
        CUSTOM_TET_MAX,
        Math.max(CUSTOM_TET_MIN, rounded),
      );

      if (clamped !== rounded) {
        setDivisorErr(
          `Allowed range is ${CUSTOM_TET_MIN}–${CUSTOM_TET_MAX}. Adjusted to ${clamped}.`,
        );
      } else {
        setDivisorErr("");
      }

      const next = String(clamped);
      setDraftDivisor(next);

      if (next !== (customDivisor ?? "")) {
        onCustomDivisorChange(next);
      }

      if (systemId !== CUSTOM_SYSTEM_ID) {
        setSystemId(CUSTOM_SYSTEM_ID);
      }

      return true;
    },
    [
      draftDivisor,
      customDivisor,
      onCustomDivisorChange,
      setSystemId,
      systemId,
    ],
  );

  const onDivisorBlur = useCallback(() => {
    if (!commitDivisor(draftDivisor)) {
      setDraftDivisor(customDivisor ?? "");
    }
  }, [commitDivisor, draftDivisor, customDivisor]);

  const onDivisorKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter") {
        const ok = commitDivisor(draftDivisor);
        if (ok) {
          event.currentTarget.blur();
        }
      }
      if (event.key === "Escape") {
        setDivisorErr("");
        setDraftDivisor(customDivisor ?? "");
        event.currentTarget.blur();
      }
    },
    [commitDivisor, draftDivisor, customDivisor],
  );

  const customLabel = useMemo(() => {
    if (!customDivisor) return "Custom";
    return `Custom (${customDivisor}-TET)`;
  }, [customDivisor]);

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
          <option value={CUSTOM_SYSTEM_ID}>{customLabel}</option>
        </select>
      </div>
      {systemId === CUSTOM_SYSTEM_ID ? (
        <div className="field">
          <span>Divisions</span>
          <input
            id="custom-tuning-divisor"
            type="number"
            min={CUSTOM_TET_MIN}
            max={CUSTOM_TET_MAX}
            step={1}
            inputMode="numeric"
            value={draftDivisor}
            onChange={(event) => {
              setDivisorErr("");
              setDraftDivisor(event.target.value);
            }}
            onBlur={onDivisorBlur}
            onKeyDown={onDivisorKeyDown}
            aria-invalid={Boolean(divisorErr)}
            aria-describedby="custom-tuning-divisor-help"
          />
          <small
            id="custom-tuning-divisor-help"
            className={`help-text${divisorErr ? " help-text--error" : ""}`}
          >
            {divisorErr ||
              `Allowed range: ${CUSTOM_TET_MIN}–${CUSTOM_TET_MAX}`}
          </small>
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
