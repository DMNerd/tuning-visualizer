import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";

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
  const fallbackId = useId();
  const inputId = id ?? `preset-picker-${fallbackId}`;
  const listId = `${inputId}-list`;
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState(selectedPreset ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

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

  useEffect(() => {
    setInputValue(selectedPreset ?? "");
    setIsFiltering(false);
  }, [selectedPreset]);

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
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex((prev) => {
      if (!filteredOptions.length) return -1;
      if (prev >= 0 && prev < filteredOptions.length) return prev;
      const selectedIdx = filteredOptions.findIndex(
        (name) => name === selectedPreset,
      );
      if (selectedIdx >= 0) return selectedIdx;
      return 0;
    });
  }, [filteredOptions, isOpen, selectedPreset]);

  const activeOptionId =
    isOpen && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined;

  const closeList = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    setIsFiltering(false);
    setInputValue(selectedPreset ?? "");
  }, [selectedPreset]);

  const commitSelection = useCallback(
    (name) => {
      if (typeof name !== "string" || !name) return;
      onSelect?.(name);
      setInputValue(name);
      setIsFiltering(false);
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onSelect],
  );

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
    setIsFiltering(true);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => {
        const next = prev + 1;
        if (next >= filteredOptions.length)
          return filteredOptions.length ? 0 : -1;
        return next;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => {
        if (!filteredOptions.length) return -1;
        const next = prev <= 0 ? filteredOptions.length - 1 : prev - 1;
        return next;
      });
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setIsOpen(true);
      if (filteredOptions.length) {
        setActiveIndex(0);
      }
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setIsOpen(true);
      if (filteredOptions.length) {
        setActiveIndex(filteredOptions.length - 1);
      }
      return;
    }

    if (event.key === "Enter") {
      if (!isOpen) return;
      event.preventDefault();
      const option =
        (activeIndex >= 0 && filteredOptions[activeIndex]) ||
        (filteredOptions.length === 1 ? filteredOptions[0] : null);
      if (option) {
        commitSelection(option);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      if (isOpen) {
        closeList();
      } else {
        setInputValue(selectedPreset ?? "");
        setIsFiltering(false);
      }
    }
  };

  const handleBlur = () => {
    requestAnimationFrame(() => {
      const root = containerRef.current;
      if (!root) return;
      const activeEl = document.activeElement;
      if (!activeEl || !root.contains(activeEl)) {
        closeList();
      }
    });
  };

  return (
    <div ref={containerRef} className="tv-preset-picker" onBlur={handleBlur}>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        className="tv-preset-picker__input"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleInputKeyDown}
        aria-autocomplete="list"
        aria-expanded={isOpen && filteredOptions.length > 0}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={activeOptionId}
        aria-haspopup="listbox"
        aria-labelledby={ariaLabelledBy}
      />
      {isOpen && (
        <ul id={listId} role="listbox" className="tv-preset-picker__list">
          {filteredOptions.length === 0 && (
            <li className="tv-preset-picker__empty" role="presentation">
              No presets match.
            </li>
          )}
          {filteredOptions.map((name, index) => {
            const badges = badgesByName.get(name) ?? [];
            return (
              <li
                key={name}
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={name === selectedPreset}
                className={clsx("tv-preset-picker__option", {
                  "is-active": index === activeIndex,
                  "is-selected": name === selectedPreset,
                  "is-custom": customPresetSet.has(name),
                })}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commitSelection(name)}
              >
                <span className="tv-preset-picker__option-title">{name}</span>
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
      )}
    </div>
  );
}
