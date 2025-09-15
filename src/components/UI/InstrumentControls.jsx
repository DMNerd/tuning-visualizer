import { useEffect, useState } from "react";
import Section from "@/components/UI/Section";

function clamp(n, min, max) {
  const v = Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, v));
}

const STR_MIN = 4;
const STR_MAX = 8;
const FRETS_MIN = 12;
const FRETS_MAX = 30;

export default function InstrumentControls({
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
  savedExists,
  handleSaveDefault,
  handleLoadSavedDefault,
  handleResetFactoryDefault,
  systemId,
}) {
  // Local text states so users can type freely
  const [stringsText, setStringsText] = useState(String(strings));
  const [fretsText, setFretsText] = useState(String(frets));

  // Error messages (shown under inputs)
  const [stringsErr, setStringsErr] = useState("");
  const [fretsErr, setFretsErr] = useState("");

  // Keep local text in sync if parent changes (e.g., preset, system switch)
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
                <label htmlFor={`string-${stringNum}`}>String {stringNum}</label>
                <select
                  id={`string-${stringNum}`}
                  name={`string-${stringNum}`}
                  value={note}
                  onChange={(e) => {
                    const copy = [...tuning];
                    copy[i] = e.target.value;
                    setTuning(copy);
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
          <button className="btn" onClick={handleSaveDefault}>
            Save as default ({systemId}, {strings}-string)
          </button>
          <button
            className="btn"
            onClick={handleLoadSavedDefault}
            disabled={!savedExists}
            title={savedExists ? "" : "No saved default for this system/count"}
          >
            Load saved
          </button>
          <button className="btn" onClick={handleResetFactoryDefault}>
            Reset to factory default
          </button>
        </div>
      </div>
    </Section>
  );
}
