import { lazy, useState } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import Section from "@shared/ui/Section";
import PresetPicker from "@features/instrument/components/PresetPicker";
import {
  STR_MIN,
  STR_MAX,
  FRETS_MIN,
  FRETS_MAX,
} from "@shared/config/appDefaults";
import { withToastPromise } from "@shared/lib/toast";
import { memoWithShallowPick } from "@shared/lib/memo";
import NumberField from "@shared/ui/NumberField";
import SegmentedRadioGroup from "@shared/ui/SegmentedRadioGroup";
import SafeLazyModal from "@shared/ui/SafeLazyModal";
import { renderNoteName } from "@domain/theory/notation";
import { normalizeIntlNoteName } from "@domain/theory/notation";
import {
  coerceNeckFilterMode,
  getNeckFilterOptions,
  NECK_FILTER_MODES,
} from "@domain/presets/neckFilterModes";

const PresetGalleryModal = lazy(
  () => import("@features/instrument/components/PresetGalleryModal"),
);

const NECK_FILTER_LABEL_KEYS = {
  [NECK_FILTER_MODES.NONE]: "instrument.neckFilterNone",
  [NECK_FILTER_MODES.KG]: "instrument.neckFilterKg",
  [NECK_FILTER_MODES.FRETLESS]: "instrument.neckFilterFretless",
};

function InstrumentControls({ state, actions, meta }) {
  const { t } = useTranslation();
  const { strings, frets, tuning, systemId, selectedPreset, neckFilterMode } =
    state;
  const {
    setFrets,
    setSystemId,
    setTuning,
    handleStringsChange,
    selectPresetEntry,
    handleSaveDefault,
    setNeckFilterMode,
    handleResetFactoryDefault,
    onCreateCustomPack,
    onEditCustomPack,
  } = actions;
  const { systems, sysNames, noteNaming, customPresetNames, presetCatalog } =
    meta;
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const safeSystems = systems ?? {};
  const safeSysNames = Array.isArray(sysNames) ? sysNames : [];
  const safeTuning = Array.isArray(tuning) ? tuning : [];

  const optionEntries = Array.from(
    new Map(
      safeSysNames.map((displayName) => [
        normalizeIntlNoteName(displayName, {
          translateGerman: noteNaming === "german",
        }),
        displayName,
      ]),
    ),
  ).map(([value, label]) => ({ value, label }));

  const onSaveDefault = () =>
    withToastPromise(
      () => handleSaveDefault?.(),
      {
        loading: t("instrument.saveDefaultLoading"),
        success: t("instrument.saveDefaultSuccess"),
        error: t("instrument.saveDefaultError"),
      },
      "save-default",
    );

  const onResetFactory = () =>
    withToastPromise(
      () => handleResetFactoryDefault?.(),
      {
        loading: t("instrument.resetFactoryLoading"),
        success: t("instrument.resetFactorySuccess"),
        error: t("instrument.resetFactoryError"),
      },
      "reset-factory",
    );

  const isCustomPreset = Array.isArray(customPresetNames)
    ? customPresetNames.includes(selectedPreset)
    : false;
  const selectedNeckFilterMode = coerceNeckFilterMode(neckFilterMode);
  const neckFilterOptions = getNeckFilterOptions({
    edo: safeSystems?.[systemId]?.divisions,
    boardMeta: null,
  }).map((option) => ({
    ...option,
    label: t(NECK_FILTER_LABEL_KEYS[option.value]),
  }));

  return (
    <Section id="instrument-controls" title={t("instrument.title")}>
      <div className={clsx("tv-controls", "tv-controls--instrument")}>
        <div className="tv-field">
          <label className="tv-field__label" htmlFor="system">
            {t("instrument.tuningSystem")}
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
            label={t("instrument.strings")}
            value={strings}
            min={STR_MIN}
            max={STR_MAX}
            onSubmit={handleStringsChange}
          />

          <NumberField
            id="frets"
            label={t("instrument.frets")}
            value={frets}
            min={FRETS_MIN}
            max={FRETS_MAX}
            onSubmit={setFrets}
          />
        </div>

        <div className="tv-controls__strings-grid">
          {safeTuning.map((note, i) => {
            const stringNum = strings - i;
            const noteValue = normalizeIntlNoteName(note, {
              translateGerman: noteNaming === "german",
            });
            const hasOption = optionEntries.some(
              (entry) => entry.value === noteValue,
            );
            return (
              <div
                // eslint-disable-next-line @eslint-react/no-array-index-key -- strings are identified by position
                key={i}
                className="tv-field"
              >
                <label htmlFor={`string-${stringNum}`}>
                  {t("instrument.string", { number: stringNum })}
                </label>
                <select
                  id={`string-${stringNum}`}
                  name={`string-${stringNum}`}
                  value={noteValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTuning((d) => {
                      d[i] = value;
                    });
                  }}
                >
                  {!hasOption && (
                    <option value={noteValue}>
                      {renderNoteName(noteValue, noteNaming)}
                    </option>
                  )}
                  {optionEntries.map((entry) => (
                    <option
                      key={`${entry.value}:${entry.label}`}
                      value={entry.value}
                    >
                      {entry.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="tv-field tv-field--spaced">
          <label htmlFor="preset">{t("instrument.preset")}</label>
          <PresetPicker
            id="preset"
            presetCatalog={presetCatalog}
            currentStrings={strings}
            selectedPreset={selectedPreset}
            onSelectEntry={selectPresetEntry}
            onOpenGallery={() => setIsGalleryOpen(true)}
          />
        </div>

        <SafeLazyModal
          isOpen={isGalleryOpen}
          resetKeys={[isGalleryOpen]}
          label={t("instrument.galleryModalLabel")}
        >
          <PresetGalleryModal
            isOpen={isGalleryOpen}
            onClose={() => setIsGalleryOpen(false)}
            presetCatalog={presetCatalog}
            currentStrings={strings}
            selectedPreset={selectedPreset}
            noteNaming={noteNaming}
            onSelectEntry={selectPresetEntry}
          />
        </SafeLazyModal>

        <div className="tv-controls__preset-actions">
          <button
            type="button"
            className="tv-button"
            onClick={() => onCreateCustomPack?.()}
          >
            {t("instrument.newPack")}
          </button>
          <button
            type="button"
            className="tv-button"
            onClick={() => onEditCustomPack?.()}
            disabled={!isCustomPreset}
          >
            {t("instrument.editPack")}
          </button>
        </div>

        <div className="tv-controls__defaults">
          <SegmentedRadioGroup
            label={t("instrument.neckFilter")}
            name="neck-filter-mode"
            className="tv-field--neck-filter"
            value={selectedNeckFilterMode}
            onChange={(value) => setNeckFilterMode?.(value)}
            options={neckFilterOptions}
          />
          <button
            className="tv-button tv-button--block"
            onClick={onSaveDefault}
          >
            {t("instrument.saveDefault", {
              system: systemId,
              count: strings,
            })}
          </button>
          <button
            className="tv-button tv-button--block"
            onClick={onResetFactory}
          >
            {t("instrument.resetFactory")}
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
    neckFilterMode: s.neckFilterMode,
    systems: m.systems,
    sysNames: m.sysNames,
    noteNaming: m.noteNaming,
    customPresetNames: m.customPresetNames,
    presetCatalog: m.presetCatalog,
    setFrets: a.setFrets,
    setSystemId: a.setSystemId,
    setTuning: a.setTuning,
    handleStringsChange: a.handleStringsChange,
    selectPresetEntry: a.selectPresetEntry,
    handleSaveDefault: a.handleSaveDefault,
    setNeckFilterMode: a.setNeckFilterMode,
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
