import { Fragment, useCallback, useMemo } from "react";
import clsx from "clsx";
import { CHORD_LABELS, isMicrotonalChordType } from "@/lib/theory/chords";
import { normalizeStringList } from "@/utils/normalizeStringList";
import BaseCombobox from "@/components/UI/combobox/BaseCombobox";

const SECTION_LABELS = {
  standard: "Standard triads & sevenths",
  microtonal: "Microtonal",
};

export default function ChordTypePicker({
  id,
  chordTypes,
  labels = CHORD_LABELS,
  selectedType,
  onSelect: handleSelect,
  supportsMicrotonal = true,
  placeholder = "Search chord types…",
  ariaLabelledBy,
}) {
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
        label: SECTION_LABELS.standard,
        options: standard,
      });
    }
    if (supportsMicrotonal && microtonal.length > 0) {
      list.push({
        key: "microtonal",
        label: SECTION_LABELS.microtonal,
        options: microtonal,
      });
    }
    return list;
  }, [normalizedOptions, supportsMicrotonal]);

  const getOptionKey = useCallback((opt) => opt.type, []);
  const getOptionLabel = useCallback((opt) => opt.label, []);
  const getFilterTerms = useCallback((opt) => [opt.label, opt.type], []);

  return (
    <BaseCombobox
      id={id}
      value={selectedType}
      onSelect={(option) => {
        if (!option) return;
        handleSelect?.(option.type);
      }}
      options={normalizedOptions}
      getOptionKey={getOptionKey}
      getOptionLabel={getOptionLabel}
      getFilterTerms={getFilterTerms}
      renderList={({ options, listProps, renderOptionItem, virtualization }) => {
        const available = new Set(options.map((opt) => opt.type));
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
        const virtualPaddingTop = virtualItems[0]?.start ?? 0;
        const lastVirtualItem = virtualItems[virtualItems.length - 1];
        const virtualPaddingBottom =
          shouldVirtualize && lastVirtualItem
            ? virtualization.rowVirtualizer.getTotalSize() - lastVirtualItem.end
            : 0;

        return (
          <ul
            {...listProps}
            ref={virtualization?.listRef ?? listProps.ref}
            className={clsx("tv-combobox__list", listProps?.className)}
            style={shouldVirtualize ? { gap: 0 } : undefined}
          >
            {shouldVirtualize && virtualPaddingTop > 0 ? (
              <li
                role="presentation"
                aria-hidden="true"
                style={{ height: virtualPaddingTop, padding: 0 }}
              />
            ) : null}
            {sections
              .map((section) => {
                const sectionOptions = section.options.filter((opt) =>
                  available.has(opt.type),
                );
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
            {shouldVirtualize && virtualPaddingBottom > 0 ? (
              <li
                role="presentation"
                aria-hidden="true"
                style={{ height: virtualPaddingBottom, padding: 0 }}
              />
            ) : null}
            {options.length === 0 ? (
              <li className="tv-combobox__empty" role="presentation">
                No chord types match.
              </li>
            ) : null}
          </ul>
        );
      }}
      placeholder={placeholder}
      aria-labelledby={ariaLabelledBy}
      className="tv-chord-type-picker"
    />
  );
}
