import { useCallback, useMemo, useState } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import ModalFrame from "@shared/ui/ModalFrame";
import useFilteredOptions from "@shared/hooks/useFilteredOptions";
import { renderNoteName } from "@domain/theory/notation";
import PresetBadgeList from "@features/instrument/components/PresetBadgeList";
import { presetDisplayName } from "@features/instrument/model/presetBadges";
import { groupPresetsByStringCount } from "@features/instrument/model/presetCatalog";
import { usePresetCatalogEntries } from "@features/instrument/hooks/usePresetCatalogEntries";

const ALL_COUNTS = "all";

export default function PresetGalleryModal({
  isOpen,
  onClose,
  presetCatalog,
  currentStrings,
  selectedPreset,
  noteNaming,
  onSelectEntry,
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [countFilter, setCountFilter] = useState(ALL_COUNTS);

  const { entries, badgesByKey, getSearchTerms } =
    usePresetCatalogEntries(presetCatalog);
  // Tunings are stored highest string first; show them low → high so they
  // read like the preset names (e.g. "EADG").
  const renderTuning = useCallback(
    (tuning) =>
      [...tuning].reverse().map((note) => renderNoteName(note, noteNaming)),
    [noteNaming],
  );
  const getFilterTerms = useCallback(
    (entry) => [...getSearchTerms(entry), renderTuning(entry.tuning).join(" ")],
    [getSearchTerms, renderTuning],
  );

  const { filteredOptions } = useFilteredOptions({
    options: entries,
    inputValue: query,
    isFiltering: query.trim().length > 0,
    getFilterTerms,
  });

  const stringCounts = useMemo(
    () =>
      [...new Set(entries.map((entry) => entry.strings))].sort((a, b) => a - b),
    [entries],
  );
  const groups = useMemo(
    () =>
      groupPresetsByStringCount(
        countFilter === ALL_COUNTS
          ? filteredOptions
          : filteredOptions.filter((entry) => entry.strings === countFilter),
      ),
    [filteredOptions, countFilter],
  );

  const handlePick = (entry) => {
    onSelectEntry?.(entry);
    onClose?.();
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t("instrument.galleryTitle")}
      cardClassName="tv-preset-gallery"
    >
      <header className="tv-modal__header">
        <h2>{t("instrument.galleryTitle")}</h2>
        <p className="tv-modal__summary">{t("instrument.gallerySummary")}</p>
        <div className="tv-modal__manager-toolbar">
          <div className="tv-modal__manager-search">
            <label htmlFor="preset-gallery-filter">
              {t("instrument.gallerySearchLabel")}
            </label>
            <input
              id="preset-gallery-filter"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("instrument.gallerySearchPlaceholder")}
              aria-controls="preset-gallery-groups"
              autoComplete="off"
            />
          </div>
        </div>
        <div
          className="tv-preset-gallery__chips"
          role="group"
          aria-label={t("instrument.galleryFilterByCount")}
        >
          {[ALL_COUNTS, ...stringCounts].map((count) => (
            <button
              key={count}
              type="button"
              className={clsx("tv-preset-gallery__chip", {
                "is-active": countFilter === count,
              })}
              aria-pressed={countFilter === count}
              onClick={() => setCountFilter(count)}
            >
              {count === ALL_COUNTS
                ? t("common.all")
                : t("instrument.stringCountShort", { count })}
            </button>
          ))}
        </div>
      </header>

      <div id="preset-gallery-groups" className="tv-preset-gallery__body">
        {groups.length === 0 ? (
          <p className="tv-preset-gallery__empty">
            {t("instrument.galleryEmpty")}
          </p>
        ) : null}
        {groups.map(([count, groupEntries]) => (
          <section
            key={count}
            className="tv-preset-gallery__group"
            aria-label={t("instrument.stringCount", { count })}
          >
            <h3 className="tv-preset-gallery__group-title">
              {t("instrument.stringCount", { count })}
              {count === currentStrings ? (
                <span className="tv-preset-picker__group-current">
                  {t("common.current")}
                </span>
              ) : null}
            </h3>
            <div className="tv-preset-gallery__grid">
              {groupEntries.map((entry) => {
                const isSelected =
                  entry.strings === currentStrings &&
                  entry.name === selectedPreset;
                return (
                  <button
                    key={entry.key}
                    type="button"
                    className={clsx("tv-preset-gallery__card", {
                      "is-selected": isSelected,
                      "is-custom": entry.isCustom,
                    })}
                    aria-pressed={isSelected}
                    onClick={() => handlePick(entry)}
                  >
                    <span className="tv-preset-gallery__card-name">
                      {presetDisplayName(t, entry.name)}
                    </span>
                    <span className="tv-preset-gallery__notes">
                      {renderTuning(entry.tuning).map((note, idx) => (
                        // eslint-disable-next-line @eslint-react/no-array-index-key -- strings are identified by position
                        <span key={idx} className="tv-preset-gallery__note">
                          {note}
                        </span>
                      ))}
                    </span>
                    <PresetBadgeList badges={badgesByKey.get(entry.key)} />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <footer className="tv-modal__footer">
        <button type="button" className="tv-button" onClick={onClose}>
          {t("common.close")}
        </button>
      </footer>
    </ModalFrame>
  );
}
