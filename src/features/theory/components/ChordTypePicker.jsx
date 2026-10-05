import { Fragment, useCallback, useMemo } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { isMicrotonalChordType } from "@domain/theory/chords";
import { normalizeStringList } from "@shared/lib/normalizeStringList";
import BaseCombobox, { VirtualSpacer } from "@shared/ui/BaseCombobox";

const SECTION_LABEL_KEYS = {
  standard: "theory.sectionStandard",
  microtonal: "theory.sectionMicrotonal",
};

export default function ChordTypePicker({
  id,
  chordTypes,
  labels,
  selectedType,
  onSelect: handleSelect,
  placeholder,
  ariaLabelledBy,
}) {
  const { t } = useTranslation();
  const normalizedOptions = useMemo(() => {
    const seen = new Set();
    return normalizeStringList(chordTypes).reduce((acc, type) => {
      if (seen.has(type)) return acc;
      seen.add(type);
      const label = labels?.[type] ?? type;
      acc.push({
        type,
        label,
        isMicrotonal: isMicrotonalChordType(type),
      });
      return acc;
    }, []);
  }, [chordTypes, labels]);

  const sections = useMemo(() => {
    const standard = [];
    const microtonal = [];
    normalizedOptions.forEach((option) => {
      if (option.isMicrotonal) {
        microtonal.push(option);
      } else {
        standard.push(option);
      }
    });

    const list = [];
    if (standard.length > 0) {
      list.push({
        key: "standard",
        label: t(SECTION_LABEL_KEYS.standard),
        options: standard,
      });
    }
    if (microtonal.length > 0) {
      list.push({
        key: "microtonal",
        label: t(SECTION_LABEL_KEYS.microtonal),
        options: microtonal,
      });
    }
    return list;
  }, [normalizedOptions, t]);

  const sectionTypes = useMemo(
    () =>
      new Set(
        sections.flatMap((section) => section.options.map((opt) => opt.type)),
      ),
    [sections],
  );

  const getOptionKey = useCallback((opt) => opt.type, []);
  const getOptionLabel = useCallback((opt) => opt.label, []);
  const getFilterTerms = useCallback((opt) => [opt.label, opt.type], []);
  const handleOptionSelect = useCallback(
    (option) => {
      if (!option) return;
      handleSelect?.(option.type);
    },
    [handleSelect],
  );
  const renderList = useCallback(
    ({
      options,
      favoriteCount,
      listProps,
      renderOptionItem,
      virtualization,
    }) => {
      const available = new Set(options.map((opt) => opt.type));
      const favorites = options
        .slice(0, favoriteCount)
        .filter((opt) => sectionTypes.has(opt.type));
      const favoriteTypes = new Set(favorites.map((opt) => opt.type));
      const listedSections = [
        ...(favorites.length > 0
          ? [
              {
                key: "favorites",
                label: t("common.favorites"),
                options: favorites,
              },
            ]
          : []),
        ...sections.map((section) => ({
          ...section,
          options: section.options.filter(
            (opt) => available.has(opt.type) && !favoriteTypes.has(opt.type),
          ),
        })),
      ];
      const optionIndexByType = new Map(
        options.map((option, index) => [option.type, index]),
      );
      const shouldVirtualize = virtualization?.shouldVirtualize;
      const virtualItems = shouldVirtualize
        ? virtualization.getVirtualItems()
        : [];
      const visibleIndexes = shouldVirtualize
        ? new Set(virtualItems.map((item) => item.index))
        : null;

      return (
        <ul
          {...listProps}
          ref={virtualization?.listRef ?? listProps.ref}
          className={clsx(
            "tv-combobox__list",
            "tv-chord-type-picker__list",
            listProps?.className,
          )}
          style={shouldVirtualize ? { gap: 0 } : undefined}
        >
          {shouldVirtualize ? (
            <VirtualSpacer height={virtualization.paddingTop} />
          ) : null}
          {listedSections
            .map((section) => {
              const sectionOptions = section.options;
              if (sectionOptions.length === 0) return null;
              return (
                <Fragment key={section.key}>
                  {!shouldVirtualize ? (
                    <li
                      role="presentation"
                      className="tv-chord-type-picker__section"
                    >
                      <span className="tv-chord-type-picker__section-label">
                        {section.label}
                      </span>
                    </li>
                  ) : null}
                  {sectionOptions.map((option) => {
                    const originalIndex = optionIndexByType.get(option.type);
                    if (typeof originalIndex !== "number") return null;
                    if (visibleIndexes && !visibleIndexes.has(originalIndex)) {
                      return null;
                    }
                    return renderOptionItem(option, originalIndex, {
                      className: clsx("tv-chord-type-picker__option", {
                        "is-microtonal": option.isMicrotonal,
                      }),
                      optionProps: shouldVirtualize
                        ? {
                            ref: virtualization.rowVirtualizer.measureElement,
                            "data-index": originalIndex,
                          }
                        : undefined,
                      content: (
                        <span className="tv-combobox__option-title">
                          {option.label}
                        </span>
                      ),
                    });
                  })}
                </Fragment>
              );
            })
            .filter(Boolean)}
          {shouldVirtualize ? (
            <VirtualSpacer height={virtualization.paddingBottom} />
          ) : null}
          {options.length === 0 ? (
            <li className="tv-combobox__empty" role="presentation">
              {t("theory.noChordTypes")}
            </li>
          ) : null}
        </ul>
      );
    },
    [sections, sectionTypes, t],
  );

  return (
    <BaseCombobox
      id={id}
      value={selectedType}
      onSelect={handleOptionSelect}
      options={normalizedOptions}
      getOptionKey={getOptionKey}
      getOptionLabel={getOptionLabel}
      getFilterTerms={getFilterTerms}
      renderList={renderList}
      favoritesScope="chord"
      placeholder={placeholder ?? t("theory.searchChordTypes")}
      aria-labelledby={ariaLabelledBy}
      className="tv-chord-type-picker"
    />
  );
}
