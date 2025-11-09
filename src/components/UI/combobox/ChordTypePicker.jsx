import { Fragment, useMemo } from "react";
import clsx from "clsx";
import { CHORD_LABELS, isMicrotonalChordType } from "@/lib/theory/chords";
import BaseCombobox from "@/components/UI/combobox/BaseCombobox";

const SECTION_LABELS = {
  standard: "Standard triads & sevenths",
  microtonal: "Microtonal",
};

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.length > 0);
}

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
    return normalizeList(chordTypes).reduce((acc, type) => {
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

  return (
    <BaseCombobox
      id={id}
      value={selectedType}
      onSelect={(option) => {
        if (!option) return;
        handleSelect?.(option.type);
      }}
      options={normalizedOptions}
      getOptionKey={(opt) => opt.type}
      getOptionLabel={(opt) => opt.label}
      getFilterTerms={(opt) => [opt.label, opt.type]}
      renderList={({
        options,
        activeIndex,
        getOptionProps,
        commitSelection,
        listProps,
      }) => {
        const available = new Set(options.map((opt) => opt.type));
        let cursor = -1;
        return (
          <ul
            {...listProps}
            className={clsx("tv-combobox__list", listProps?.className)}
          >
            {sections
              .map((section) => {
                const sectionOptions = section.options.filter((opt) =>
                  available.has(opt.type),
                );
                if (sectionOptions.length === 0) return null;
                return (
                  <Fragment key={section.key}>
                    <li
                      role="presentation"
                      className="tv-chord-type-picker__section"
                    >
                      <span className="tv-chord-type-picker__section-label">
                        {section.label}
                      </span>
                    </li>
                    {sectionOptions.map((option) => {
                      cursor += 1;
                      const optionProps = getOptionProps(cursor, {
                        option,
                        onSelect: () => commitSelection(option),
                      });
                      return (
                        <li
                          key={option.type}
                          {...optionProps}
                          aria-selected={option.type === selectedType}
                          className={clsx(
                            "tv-combobox__option",
                            "tv-chord-type-picker__option",
                            {
                              "is-active": cursor === activeIndex,
                              "is-selected": option.type === selectedType,
                              "is-microtonal": option.isMicrotonal,
                            },
                          )}
                        >
                          <span className="tv-combobox__option-title">
                            {option.label}
                          </span>
                        </li>
                      );
                    })}
                  </Fragment>
                );
              })
              .filter(Boolean)}
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
