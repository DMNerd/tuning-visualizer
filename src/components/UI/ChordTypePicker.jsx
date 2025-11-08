import { Fragment, useCallback, useEffect, useMemo } from "react";
import clsx from "clsx";
import { CHORD_LABELS, isMicrotonalChordType } from "@/lib/theory/chords";
import FloatingListbox from "@/components/UI/FloatingListbox";
import useCombobox from "@/hooks/useCombobox";

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.length > 0);
}

const SECTION_LABELS = {
  standard: "Standard triads & sevenths",
  microtonal: "Microtonal",
};

export default function ChordTypePicker({
  id,
  chordTypes,
  labels = CHORD_LABELS,
  selectedType,
  onSelect,
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
        labelLower: label.toLowerCase(),
        typeLower: type.toLowerCase(),
        isMicrotonal: isMicrotonalChordType(type),
      });
      return acc;
    }, []);
  }, [chordTypes, labels]);

  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => option.type === selectedType),
    [normalizedOptions, selectedType],
  );

  const selectedLabel = selectedOption?.label ?? "";

  const {
    rootRef,
    rootProps,
    inputId,
    listId,
    inputValue,
    setInputValue,
    isOpen,
    isFiltering,
    setIsFiltering,
    activeIndex,
    getInputProps,
    getOptionId,
    getOptionProps,
    commitSelection: commitComboboxSelection,
    setOptions,
    listProps,
  } = useCombobox({
    id,
    selectedKey: selectedType,
    getOptionKey: (option) => option?.type,
    selectedText: selectedLabel,
    initialInputValue: selectedLabel,
  });

  useEffect(() => {
    setInputValue(selectedLabel);
    setIsFiltering(false);
  }, [selectedLabel, setInputValue, setIsFiltering]);

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

  const normalizedQuery = useMemo(() => {
    if (!isFiltering) return "";
    return inputValue.trim().toLowerCase();
  }, [inputValue, isFiltering]);

  const filteredSections = useMemo(() => {
    if (!normalizedQuery) return sections;
    return sections
      .map((section) => {
        const options = section.options.filter(
          (option) =>
            option.labelLower.includes(normalizedQuery) ||
            option.typeLower.includes(normalizedQuery),
        );
        return { ...section, options };
      })
      .filter((section) => section.options.length > 0);
  }, [normalizedQuery, sections]);

  const flattenedOptions = useMemo(
    () => filteredSections.flatMap((section) => section.options),
    [filteredSections],
  );

  useEffect(() => {
    setOptions(flattenedOptions);
  }, [flattenedOptions, setOptions]);

  const activeOptionId =
    isOpen && activeIndex >= 0 ? getOptionId(activeIndex) : undefined;

  const commitSelection = useCallback(
    (option) => {
      if (!option || typeof option.type !== "string") return;
      onSelect?.(option.type);
      setInputValue(option.label);
      commitComboboxSelection({ inputValue: option.label });
    },
    [commitComboboxSelection, onSelect, setInputValue],
  );

  const inputProps = getInputProps({
    onCommit: (option) => commitSelection(option),
  });

  let optionCursor = -1;

  return (
    <div
      {...rootProps}
      ref={rootRef}
      className="tv-combobox tv-chord-type-picker"
    >
      <input
        id={inputId}
        type="text"
        role="combobox"
        className="tv-combobox__input"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={inputValue}
        ref={inputProps.ref}
        onChange={inputProps.onChange}
        onFocus={inputProps.onFocus}
        onKeyDown={inputProps.onKeyDown}
        aria-autocomplete="list"
        aria-expanded={isOpen && flattenedOptions.length > 0}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={activeOptionId}
        aria-haspopup="listbox"
        aria-labelledby={ariaLabelledBy}
      />
      {isOpen && (
        <FloatingListbox anchorRef={rootRef} isOpen={isOpen}>
          <ul {...listProps} className="tv-combobox__list">
            {flattenedOptions.length === 0 ? (
              <li className="tv-combobox__empty" role="presentation">
                No chord types match.
              </li>
            ) : (
              filteredSections.map((section) => (
                <Fragment key={section.key}>
                  <li
                    role="presentation"
                    className="tv-chord-type-picker__section"
                  >
                    <span className="tv-chord-type-picker__section-label">
                      {section.label}
                    </span>
                  </li>
                  {section.options.map((option) => {
                    optionCursor += 1;
                    const optionIndex = optionCursor;
                    const optionProps = getOptionProps(optionIndex, {
                      option,
                      onSelect: () => commitSelection(option),
                    });
                    return (
                      <li
                        {...optionProps}
                        key={option.type}
                        aria-selected={option.type === selectedType}
                        className={clsx(
                          "tv-combobox__option",
                          "tv-chord-type-picker__option",
                          {
                            "is-active": optionIndex === activeIndex,
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
              ))
            )}
          </ul>
        </FloatingListbox>
      )}
    </div>
  );
}
