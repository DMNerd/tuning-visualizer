import { useCallback, useEffect, useMemo } from "react";
import clsx from "clsx";
import FloatingListbox from "@/components/UI/FloatingListbox";
import useCombobox from "@/hooks/useCombobox";

function toBadges({ name, customPresetSet, presetMetaMap }) {
  const badges = [];
  if (customPresetSet.has(name)) {
    badges.push({ key: "custom", label: "Custom", variant: "accent" });
  }

  const meta = presetMetaMap?.[name];
  if (meta) {
    const stringMeta = meta?.stringMeta;
    let stringMetaCount = 0;
    if (stringMeta instanceof Map) {
      stringMetaCount = stringMeta.size;
    } else if (Array.isArray(stringMeta)) {
      stringMetaCount = stringMeta.length;
    }
    if (stringMetaCount > 0) {
      badges.push({ key: "string-meta", label: "String markers" });
    }

    const boardMeta = meta?.board;
    if (boardMeta) {
      const boardLabels = [];
      if (boardMeta.notePlacement === "onFret") {
        boardLabels.push("On-fret notes");
      } else if (boardMeta.notePlacement === "between") {
        boardLabels.push("Between frets");
      }

      if (boardMeta.fretStyle === "dotted") {
        boardLabels.push("Dotted frets");
      } else if (boardMeta.fretStyle === "solid") {
        boardLabels.push("Solid frets");
      }

      if (!boardLabels.length) {
        boardLabels.push("Board styling");
      }

      boardLabels.forEach((label, idx) => {
        badges.push({ key: `board-${idx}-${label}`, label });
      });
    }
  }

  return badges;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.length > 0);
}

export default function PresetPicker({
  id,
  presetNames,
  selectedPreset,
  onSelect,
  customPresetNames,
  presetMetaMap,
  placeholder = "Search presets…",
  ariaLabelledBy,
}) {
  const allPresetNames = useMemo(
    () => normalizeList(presetNames),
    [presetNames],
  );
  const customPresetSet = useMemo(
    () => new Set(normalizeList(customPresetNames)),
    [customPresetNames],
  );

  const badgesByName = useMemo(() => {
    const map = new Map();
    allPresetNames.forEach((name) => {
      map.set(
        name,
        toBadges({
          name,
          customPresetSet,
          presetMetaMap: presetMetaMap ?? {},
        }),
      );
    });
    return map;
  }, [allPresetNames, customPresetSet, presetMetaMap]);

  const selectedLabel = selectedPreset ?? "";

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
    selectedKey: selectedPreset,
    getOptionKey: (option) => option,
    selectedText: selectedLabel,
    initialInputValue: selectedLabel,
  });

  useEffect(() => {
    setInputValue(selectedLabel);
    setIsFiltering(false);
  }, [selectedLabel, setInputValue, setIsFiltering]);

  const normalizedQuery = useMemo(() => {
    if (!isFiltering) return "";
    return inputValue.trim().toLowerCase();
  }, [inputValue, isFiltering]);

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return allPresetNames;
    return allPresetNames.filter((name) =>
      name.toLowerCase().includes(normalizedQuery),
    );
  }, [allPresetNames, normalizedQuery]);

  useEffect(() => {
    setOptions(filteredOptions);
  }, [filteredOptions, setOptions]);

  const activeOptionId =
    isOpen && activeIndex >= 0 ? getOptionId(activeIndex) : undefined;

  const commitSelection = useCallback(
    (name) => {
      if (typeof name !== "string" || !name) return;
      onSelect?.(name);
      setInputValue(name);
      commitComboboxSelection({ inputValue: name });
    },
    [commitComboboxSelection, onSelect, setInputValue],
  );

  const inputProps = getInputProps({
    onCommit: (option) => commitSelection(option),
  });

  return (
    <div {...rootProps} ref={rootRef} className="tv-combobox tv-preset-picker">
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
        aria-expanded={isOpen && filteredOptions.length > 0}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={activeOptionId}
        aria-haspopup="listbox"
        aria-labelledby={ariaLabelledBy}
      />
      {isOpen && (
        <FloatingListbox anchorRef={rootRef} isOpen={isOpen}>
          <ul {...listProps} className="tv-combobox__list">
            {filteredOptions.length === 0 && (
              <li className="tv-combobox__empty" role="presentation">
                No presets match.
              </li>
            )}
            {filteredOptions.map((name, index) => {
              const badges = badgesByName.get(name) ?? [];
              const optionProps = getOptionProps(index, {
                option: name,
                onSelect: () => commitSelection(name),
              });
              return (
                <li
                  {...optionProps}
                  key={name}
                  aria-selected={name === selectedPreset}
                  className={clsx(
                    "tv-combobox__option",
                    "tv-preset-picker__option",
                    {
                      "is-active": index === activeIndex,
                      "is-selected": name === selectedPreset,
                      "is-custom": customPresetSet.has(name),
                    },
                  )}
                >
                  <span className="tv-combobox__option-title">{name}</span>
                  {badges.length > 0 && (
                    <span className="tv-preset-picker__option-meta">
                      {badges.map((badge) => (
                        <span
                          key={badge.key}
                          className={clsx("tv-preset-picker__meta-badge", {
                            "tv-preset-picker__meta-badge--accent":
                              badge.variant === "accent",
                          })}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </FloatingListbox>
      )}
    </div>
  );
}
