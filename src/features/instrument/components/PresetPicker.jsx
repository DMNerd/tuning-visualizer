import { Fragment, useCallback, useMemo } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { FiGrid } from "react-icons/fi";
import BaseCombobox from "@shared/ui/BaseCombobox";
import PresetBadgeList from "@features/instrument/components/PresetBadgeList";
import {
  isBuiltInPreset,
  presetDisplayName,
} from "@features/instrument/model/presetBadges";
import {
  groupPresetsByStringCount,
  presetEntryKey,
} from "@features/instrument/model/presetCatalog";
import { usePresetCatalogEntries } from "@features/instrument/hooks/usePresetCatalogEntries";

const preventBlur = (event) => event.preventDefault();

// Factory/saved defaults already lead their group, so they aren't starrable.
const canFavoritePreset = (entry) => !isBuiltInPreset(entry.name);

// Keeps each string-count group contiguous (so keyboard order matches the
// rendered groups) while the top search hit's group stays first.
function orderByStringCountGroup(options) {
  return groupPresetsByStringCount(options).flatMap(([, entries]) => entries);
}

export default function PresetPicker({
  id,
  presetCatalog,
  currentStrings,
  selectedPreset,
  onSelectEntry,
  onOpenGallery,
  placeholder,
  ariaLabelledBy,
}) {
  const { t } = useTranslation();
  const {
    entries: options,
    badgesByKey,
    getSearchTerms,
  } = usePresetCatalogEntries(presetCatalog);

  // Fall back to the bare name so the input never shows the "count:name" key
  // while a queued preset is not in the catalog yet.
  const selectedValue = useMemo(() => {
    if (!selectedPreset) return "";
    const key = presetEntryKey(currentStrings, selectedPreset);
    return options.some((entry) => entry.key === key) ? key : selectedPreset;
  }, [options, currentStrings, selectedPreset]);

  const getOptionKey = useCallback((entry) => entry.key, []);
  const getOptionLabel = useCallback(
    (entry) => presetDisplayName(t, entry.name),
    [t],
  );
  const handleOptionSelect = useCallback(
    (entry) => {
      if (typeof entry?.name !== "string") return;
      onSelectEntry?.(entry);
    },
    [onSelectEntry],
  );
  const renderOption = useCallback(
    (entry, { isActive, inFavorites }) => (
      <div
        className={clsx("tv-preset-picker__option", {
          "is-active": isActive,
          "is-custom": entry.isCustom,
        })}
      >
        <span className="tv-combobox__option-title">
          {presetDisplayName(t, entry.name)}
        </span>
        {/* The favorites group mixes string counts, so name each one */}
        <PresetBadgeList
          badges={
            inFavorites
              ? [
                  {
                    key: "strings",
                    labelKey: "instrument.stringCountShort",
                    labelOptions: { count: entry.strings },
                  },
                  ...(badgesByKey.get(entry.key) ?? []),
                ]
              : badgesByKey.get(entry.key)
          }
        />
      </div>
    ),
    [badgesByKey, t],
  );

  const renderList = useCallback(
    ({
      options: visible,
      favoriteCount,
      listProps,
      renderOptionItem,
      closeList,
    }) => (
      <ul
        {...listProps}
        className="tv-combobox__list tv-preset-picker__list"
        aria-labelledby={ariaLabelledBy}
      >
        {visible.length === 0 ? (
          <li className="tv-combobox__empty" role="presentation">
            {t("common.noMatches")}
          </li>
        ) : null}
        {visible.map((entry, index) => (
          <Fragment key={entry.key}>
            {favoriteCount > 0 && index === 0 ? (
              <li role="presentation" className="tv-preset-picker__group">
                {t("common.favorites")}
              </li>
            ) : null}
            {index >= favoriteCount &&
            (index === favoriteCount ||
              entry.strings !== visible[index - 1]?.strings) ? (
              <li role="presentation" className="tv-preset-picker__group">
                {t("instrument.stringCount", { count: entry.strings })}
                {entry.strings === currentStrings ? (
                  <span className="tv-preset-picker__group-current">
                    {t("common.current")}
                  </span>
                ) : null}
              </li>
            ) : null}
            {renderOptionItem(entry, index)}
          </Fragment>
        ))}
        {onOpenGallery ? (
          <li role="presentation" className="tv-preset-picker__footer">
            <button
              type="button"
              className="tv-preset-picker__gallery-button"
              tabIndex={-1}
              onMouseDown={preventBlur}
              onPointerDown={preventBlur}
              onClick={() => {
                closeList();
                // Blur so the modal doesn't hand focus back to the input on
                // close, which would reopen the list.
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                onOpenGallery();
              }}
            >
              <FiGrid aria-hidden />
              {t("instrument.browseGallery")}
            </button>
          </li>
        ) : null}
      </ul>
    ),
    [ariaLabelledBy, currentStrings, onOpenGallery, t],
  );

  return (
    <BaseCombobox
      id={id}
      value={selectedValue}
      onSelect={handleOptionSelect}
      options={options}
      getOptionKey={getOptionKey}
      getOptionLabel={getOptionLabel}
      getFilterTerms={getSearchTerms}
      orderFilteredOptions={orderByStringCountGroup}
      renderOption={renderOption}
      renderList={renderList}
      favoritesScope="preset"
      canFavorite={canFavoritePreset}
      enableVirtualization={false}
      placeholder={placeholder ?? t("instrument.searchPresets")}
      aria-labelledby={ariaLabelledBy}
      className="tv-preset-picker"
    />
  );
}
