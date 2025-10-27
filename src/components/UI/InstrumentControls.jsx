import React, { useEffect, useState } from "react";
import { dequal } from "dequal";
import clsx from "clsx";
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

function commitNumberField({
  rawOverride,
  textValue,
  min,
  max,
  setError,
  setText,
  onSubmit,
}) {
  const raw =
    typeof rawOverride === "number" ? rawOverride : parseInt(textValue, 10);

  if (!Number.isFinite(raw)) {
    setError(`Please enter a number between ${min} and ${max}.`);
    return false;
  }

  const val = clamp(raw, min, max);
  if (val !== raw) {
    setError(`Allowed range is ${min}–${max}. Adjusted to ${val}.`);
  } else {
    setError("");
  }
  onSubmit(val);
  setText(String(val));
  return true;
}

function InstrumentControls({
  strings,
  frets,
  setFrets,
  sysNames,
  tuning,
  setTuning,
  handleStringsChange,
  presetNames,
  customPresetNames,
  selectedPreset,
  setSelectedPreset,
  handleSaveDefault,
  handleResetFactoryDefault,
  systemId,
  onCreateCustomPack,
  onEditCustomPack,
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
    return commitNumberField({
      rawOverride,
      textValue: stringsText,
      min: STR_MIN,
      max: STR_MAX,
      setError: setStringsErr,
      setText: setStringsText,
      onSubmit: handleStringsChange,
    });
  }

  function commitFrets(rawOverride) {
    return commitNumberField({
      rawOverride,
      textValue: fretsText,
      min: FRETS_MIN,
      max: FRETS_MAX,
      setError: setFretsErr,
      setText: setFretsText,
      onSubmit: setFrets, // marks fretsTouched in App
    });
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

  const isCustomPreset = Array.isArray(customPresetNames)
    ? customPresetNames.includes(selectedPreset)
    : false;

  return (
    <Section title="Instrument">
      <div className={clsx("tv-controls", "tv-controls--instrument")}>
        <div className="tv-controls__row--two">
          {/* Strings */}
          <div className="tv-field">
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
              className={clsx("tv-field__help", {
                "tv-field__help--error": stringsErr,
              })}
            >
              {stringsErr || `Allowed range: ${STR_MIN}–${STR_MAX}`}
            </small>
          </div>

          {/* Frets */}
          <div className="tv-field">
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
              className={clsx("tv-field__help", {
                "tv-field__help--error": fretsErr,
              })}
            >
              {fretsErr || `Allowed range: ${FRETS_MIN}–${FRETS_MAX}`}
            </small>
          </div>
        </div>

        <div className="tv-controls__strings-grid">
          {tuning.map((note, i) => {
            const stringNum = strings - i;
            return (
              <div key={i} className="tv-field">
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

        <div className="tv-field tv-field--spaced">
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

        <div className="tv-controls__preset-actions">
          <button
            type="button"
            className="tv-button"
            onClick={() => onCreateCustomPack?.()}
          >
            New custom pack
          </button>
          <button
            type="button"
            className="tv-button"
            onClick={() => onEditCustomPack?.()}
            disabled={!isCustomPreset}
          >
            Edit pack
          </button>
        </div>

        <div className="tv-controls__defaults">
          <button
            className="tv-button tv-button--block"
            onClick={onSaveDefault}
          >
            Save as default ({systemId}, {strings}-string)
          </button>
          <button
            className="tv-button tv-button--block"
            onClick={onResetFactory}
          >
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
    setFrets: p.setFrets,
    sysNames: p.sysNames,
    tuning: p.tuning,
    setTuning: p.setTuning,
    presetNames: p.presetNames,
    customPresetNames: p.customPresetNames,
    selectedPreset: p.selectedPreset,
    setSelectedPreset: p.setSelectedPreset,
    handleStringsChange: p.handleStringsChange,
    handleSaveDefault: p.handleSaveDefault,
    handleResetFactoryDefault: p.handleResetFactoryDefault,
    systemId: p.systemId,
    onCreateCustomPack: p.onCreateCustomPack,
    onEditCustomPack: p.onEditCustomPack,
  };
}
export default React.memo(InstrumentControls, (a, b) =>
  dequal(pick(a), pick(b)),
);
