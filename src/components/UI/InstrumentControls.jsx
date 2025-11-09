import { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import Section from "@/components/UI/Section";
import PresetPicker from "@/components/UI/combobox/PresetPicker";
import {
  STR_MIN,
  STR_MAX,
  FRETS_MIN,
  FRETS_MAX,
} from "@/lib/config/appDefaults";
import { clamp } from "@/utils/math";
import { withToastPromise } from "@/utils/toast";
import { memoWithPick } from "@/utils/memo";

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

function useNumberField({ value, min, max, onSubmit }) {
  const [text, setText] = useState(String(value));
  const [error, setError] = useState("");

  useEffect(() => setText(String(value)), [value]);

  const commit = useCallback(
    (rawOverride) =>
      commitNumberField({
        rawOverride,
        textValue: text,
        min,
        max,
        setError,
        setText,
        onSubmit,
      }),
    [text, min, max, onSubmit],
  );

  const revert = useCallback(() => {
    setText(String(value));
  }, [value]);

  const onBlur = useCallback(() => {
    if (!commit()) revert();
  }, [commit, revert]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") {
        revert();
        setError("");
        e.currentTarget.blur();
      }
    },
    [commit, revert],
  );

  const onChange = useCallback((e) => {
    setText(e.target.value);
  }, []);

  return {
    text,
    error,
    onChange,
    onBlur,
    onKeyDown,
    placeholder: `${min}–${max}`,
    helpText: error || `Allowed range: ${min}–${max}`,
  };
}

function NumberField({ id, label, value, min, max, onSubmit }) {
  const { text, error, onChange, onBlur, onKeyDown, placeholder, helpText } =
    useNumberField({ value, min, max, onSubmit });
  const helpId = `${id}-help`;

  return (
    <div className="tv-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type="number"
        min={min}
        max={max}
        step={1}
        value={text}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        aria-invalid={Boolean(error)}
        aria-describedby={helpId}
        placeholder={placeholder}
      />
      <small
        id={helpId}
        className={clsx("tv-field__help", {
          "tv-field__help--error": error,
        })}
      >
        {helpText}
      </small>
    </div>
  );
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
  presetMetaMap,
  selectedPreset,
  setSelectedPreset,
  handleSaveDefault,
  handleResetFactoryDefault,
  systemId,
  onCreateCustomPack,
  onEditCustomPack,
}) {
  const onSaveDefault = () =>
    withToastPromise(
      () => handleSaveDefault?.(),
      {
        loading: "Saving default…",
        success: "Default saved.",
        error: "Failed to save default.",
      },
      "save-default",
    );

  const onResetFactory = () =>
    withToastPromise(
      () => handleResetFactoryDefault?.(),
      {
        loading: "Restoring factory settings…",
        success: "Factory settings restored.",
        error: "Failed to restore factory settings.",
      },
      "reset-factory",
    );

  const isCustomPreset = Array.isArray(customPresetNames)
    ? customPresetNames.includes(selectedPreset)
    : false;

  return (
    <Section title="Instrument">
      <div className={clsx("tv-controls", "tv-controls--instrument")}>
        <div className="tv-controls__row--two">
          <NumberField
            id="strings"
            label="Strings"
            value={strings}
            min={STR_MIN}
            max={STR_MAX}
            onSubmit={handleStringsChange}
          />

          <NumberField
            id="frets"
            label="Frets"
            value={frets}
            min={FRETS_MIN}
            max={FRETS_MAX}
            onSubmit={setFrets}
          />
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
          <PresetPicker
            id="preset"
            presetNames={presetNames}
            selectedPreset={selectedPreset}
            onSelect={setSelectedPreset}
            customPresetNames={customPresetNames}
            presetMetaMap={presetMetaMap}
          />
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
    presetMetaMap: p.presetMetaMap,
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

const InstrumentControlsMemo = memoWithPick(InstrumentControls, pick);

export default InstrumentControlsMemo;
