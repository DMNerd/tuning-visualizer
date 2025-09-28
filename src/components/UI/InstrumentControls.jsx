import React, { useEffect, useState } from "react";
import { dequal } from "dequal";
import Section from "@/components/UI/Section";
import {
  STR_MIN,
  STR_MAX,
  FRETS_MIN,
  FRETS_MAX,
} from "@/lib/config/appDefaults";
import { toast } from "react-hot-toast";

function clamp(n, min, max) {
  const v = Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, v));
}

function InstrumentControls({
  strings,
  frets,
  setFrets, // pass setFretsUI from App to mark 'touched'
  sysNames,
  tuning,
  setTuning,
  handleStringsChange,
  presetNames,
  selectedPreset,
  setSelectedPreset,
  handleSaveDefault,
  handleResetFactoryDefault,
  systemId,
}) {
  // Local text states so users can type freely
  const [stringsText, setStringsText] = useState(String(strings));
  const [fretsText, setFretsText] = useState(String(frets));

  // Error messages (shown under inputs)
  const [stringsErr, setStringsErr] = useState("");
  const [fretsErr, setFretsErr] = useState("");

  // Keep local text in sync if parent changes
  useEffect(() => setStringsText(String(strings)), [strings]);
  useEffect(() => setFretsText(String(frets)), [frets]);

  // ---- Commit helpers ----
  function commitStrings(rawOverride) {
    const raw =
      typeof rawOverride === "number" ? rawOverride : parseInt(stringsText, 10);

    if (!Number.isFinite(raw)) {
      setStringsErr(`Please enter a number between ${STR_MIN} and ${STR_MAX}.`);
      return false;
    }

    const val = clamp(raw, STR_MIN, STR_MAX);
    if (val !== raw) {
      setStringsErr(
        `Allowed range is ${STR_MIN}–${STR_MAX}. Adjusted to ${val}.`,
      );
    } else {
      setStringsErr("");
    }
    handleStringsChange(val);
    setStringsText(String(val));
    return true;
  }

  function commitFrets(rawOverride) {
    const raw =
      typeof rawOverride === "number" ? rawOverride : parseInt(fretsText, 10);

    if (!Number.isFinite(raw)) {
      setFretsErr(
        `Please enter a number between ${FRETS_MIN} and ${FRETS_MAX}.`,
      );
      return false;
    }

    const val = clamp(raw, FRETS_MIN, FRETS_MAX);
    if (val !== raw) {
      setFretsErr(
        `Allowed range is ${FRETS_MIN}–${FRETS_MAX}. Adjusted to ${val}.`,
      );
    } else {
      setFretsErr("");
    }
    setFrets(val); // marks fretsTouched in App
    setFretsText(String(val));
    return true;
  }

  // ---- Handlers ----
  const onStringsBlur = () => {
    if (!commitStrings()) {
      setStringsText(String(strings));
    }
  };
  const onFretsBlur = () => {
    if (!commitFrets()) {
      setFretsText(String(frets));
    }
  };

  const onStringsKeyDown = (e) => {
    if (e.key === "Enter") commitStrings();
    if (e.key === "Escape") {
      setStringsText(String(strings));
      setStringsErr("");
      e.currentTarget.blur();
    }
  };

  const onFretsKeyDown = (e) => {
    if (e.key === "Enter") commitFrets();
    if (e.key === "Escape") {
      setFretsText(String(frets));
      setFretsErr("");
      e.currentTarget.blur();
    }
  };

  const onSaveDefault = () =>
    toast.promise(
      Promise.resolve().then(() => handleSaveDefault?.()),
      {
        loading: "Saving default…",
        success: "Default saved.",
        error: "Failed to save default.",
      },
      { id: "save-default" },
    );

  const onResetFactory = () =>
    toast.promise(
      Promise.resolve().then(() => handleResetFactoryDefault?.()),
      {
        loading: "Restoring factory settings…",
        success: "Factory settings restored.",
        error: "Failed to restore factory settings.",
      },
      { id: "reset-factory" },
    );

  return (
    <Section title="Instrument">
      <div className="instrument">
        <div className="row-2">
          {/* Strings */}
          <div className="field">
            <label htmlFor="strings">Strings</label>
            <input
              id="strings"
              name="strings"
              type="number"
              min={STR_MIN}
              max={STR_MAX}
              step={1}
              value={stringsText}
              onChange={(e) => setStringsText(e.target.value)}
              onBlur={onStringsBlur}
              onKeyDown={onStringsKeyDown}
              aria-invalid={Boolean(stringsErr)}
              aria-describedby="strings-help"
              placeholder={`${STR_MIN}–${STR_MAX}`}
            />
            <small
              id="strings-help"
              style={{ color: stringsErr ? "var(--root)" : "var(--muted)" }}
            >
              {stringsErr || `Allowed range: ${STR_MIN}–${STR_MAX}`}
            </small>
          </div>

          {/* Frets */}
          <div className="field">
            <label htmlFor="frets">Frets</label>
            <input
              id="frets"
              name="frets"
              type="number"
              min={FRETS_MIN}
              max={FRETS_MAX}
              step={1}
              value={fretsText}
              onChange={(e) => setFretsText(e.target.value)}
              onBlur={onFretsBlur}
              onKeyDown={onFretsKeyDown}
              aria-invalid={Boolean(fretsErr)}
              aria-describedby="frets-help"
              placeholder={`${FRETS_MIN}–${FRETS_MAX}`}
            />
            <small
              id="frets-help"
              style={{ color: fretsErr ? "var(--root)" : "var(--muted)" }}
            >
              {fretsErr || `Allowed range: ${FRETS_MIN}–${FRETS_MAX}`}
            </small>
          </div>
        </div>

        <div className="strings-grid">
          {tuning.map((note, i) => {
            const stringNum = strings - i;
            return (
              <div key={i} className="field">
                <label htmlFor={`string-${stringNum}`}>
                  String {stringNum}
                </label>
                <select
                  id={`string-${stringNum}`}
                  name={`string-${stringNum}`}
                  value={note}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTuning((d) => {
                      d[i] = value;
                    });
                  }}
                >
                  {sysNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="field" style={{ marginTop: 8 }}>
          <label htmlFor="preset">Preset</label>
          <select
            id="preset"
            name="preset"
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
          >
            {presetNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div
          className="defaults-row"
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          <button className="btn" onClick={onSaveDefault}>
            Save as default ({systemId}, {strings}-string)
          </button>
          <button className="btn" onClick={onResetFactory}>
            Reset to factory default
          </button>
        </div>
      </div>
    </Section>
  );
}

function pick(p) {
  return {
    strings: p.strings,
    frets: p.frets,
    sysNames: p.sysNames,
    tuning: p.tuning,
    presetNames: p.presetNames,
    selectedPreset: p.selectedPreset,
    systemId: p.systemId,
  };
}
export default React.memo(InstrumentControls, (a, b) =>
  dequal(pick(a), pick(b)),
);
