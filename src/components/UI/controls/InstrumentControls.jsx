import clsx from "clsx";
import Section from "@/components/UI/Section";
import PresetPicker from "@/components/UI/combobox/PresetPicker";
import {
  STR_MIN,
  STR_MAX,
  FRETS_MIN,
  FRETS_MAX,
} from "@/lib/config/appDefaults";
import { withToastPromise } from "@/utils/toast";
import { memoWithShallowPick } from "@/utils/memo";
import NumberField from "@/components/UI/NumberField";

function InstrumentControls({ state, actions, meta }) {
  const { strings, frets, tuning, systemId, selectedPreset } = state;
  const {
    setFrets,
    setSystemId,
    setTuning,
    handleStringsChange,
    setSelectedPreset,
    handleSaveDefault,
    handleResetFactoryDefault,
    onCreateCustomPack,
    onEditCustomPack,
  } = actions;
  const { systems, sysNames, presetNames, customPresetNames, presetMetaMap } =
    meta;
  const safeSystems = systems ?? {};
  const safeSysNames = Array.isArray(sysNames) ? sysNames : [];
  const safeTuning = Array.isArray(tuning) ? tuning : [];

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
    <Section id="instrument-controls" title="Instrument">
      <div className={clsx("tv-controls", "tv-controls--instrument")}>
        <div className="tv-field">
          <label className="tv-field__label" htmlFor="system">
            Tuning system
          </label>
          <select
            id="system"
            name="system"
            value={systemId}
            onChange={(e) => setSystemId(e.target.value)}
          >
            {Object.keys(safeSystems).map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>

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
          {safeTuning.map((note, i) => {
            const stringNum = strings - i;
            const hasOption = safeSysNames.includes(note);
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
                  {!hasOption && <option value={note}>{note}</option>}
                  {safeSysNames.map((n) => (
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

function pickInstrumentMemoProps(p) {
  const s = p.state ?? {};
  const a = p.actions ?? {};
  const m = p.meta ?? {};
  return {
    strings: s.strings,
    frets: s.frets,
    tuning: s.tuning,
    systemId: s.systemId,
    selectedPreset: s.selectedPreset,
    systems: m.systems,
    sysNames: m.sysNames,
    presetNames: m.presetNames,
    customPresetNames: m.customPresetNames,
    presetMetaMap: m.presetMetaMap,
    setFrets: a.setFrets,
    setSystemId: a.setSystemId,
    setTuning: a.setTuning,
    handleStringsChange: a.handleStringsChange,
    setSelectedPreset: a.setSelectedPreset,
    handleSaveDefault: a.handleSaveDefault,
    handleResetFactoryDefault: a.handleResetFactoryDefault,
    onCreateCustomPack: a.onCreateCustomPack,
    onEditCustomPack: a.onEditCustomPack,
  };
}

// React Profiler note: this panel depends on array/object references from state
// and metadata, but deep structural checks are unnecessary; shallow identity
// checks match the update model from React state/Immer.
const InstrumentControlsMemo = memoWithShallowPick(
  InstrumentControls,
  pickInstrumentMemoProps,
);

export default InstrumentControlsMemo;
