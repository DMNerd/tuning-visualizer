import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import { CHORD_LABELS, isMicrotonalChordType } from "@/lib/theory/chords";

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
  const fallbackId = useId();
  const inputId = id ?? `chord-type-picker-${fallbackId}`;
  const listId = `${inputId}-list`;
  const containerRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

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

  useEffect(() => {
    setInputValue(selectedOption?.label ?? "");
    setIsFiltering(false);
  }, [selectedOption]);

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
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex((prev) => {
      if (!flattenedOptions.length) return -1;
      if (prev >= 0 && prev < flattenedOptions.length) return prev;
      const selectedIdx = flattenedOptions.findIndex(
        (option) => option.type === selectedType,
      );
      if (selectedIdx >= 0) return selectedIdx;
      return 0;
    });
  }, [flattenedOptions, isOpen, selectedType]);

  const selectedLabel = selectedOption?.label ?? "";
  const activeOptionId =
    isOpen && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined;

  const closeList = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    setIsFiltering(false);
    setInputValue(selectedLabel);
  }, [selectedLabel]);

  const commitSelection = useCallback(
    (option) => {
      if (!option || typeof option.type !== "string") return;
      onSelect?.(option.type);
      setInputValue(option.label);
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
        if (next >= flattenedOptions.length)
          return flattenedOptions.length ? 0 : -1;
        return next;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => {
        if (!flattenedOptions.length) return -1;
        const next = prev <= 0 ? flattenedOptions.length - 1 : prev - 1;
        return next;
      });
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setIsOpen(true);
      if (flattenedOptions.length) {
        setActiveIndex(0);
      }
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setIsOpen(true);
      if (flattenedOptions.length) {
        setActiveIndex(flattenedOptions.length - 1);
      }
      return;
    }

    if (event.key === "Enter") {
      if (!isOpen) return;
      event.preventDefault();
      const option =
        (activeIndex >= 0 && flattenedOptions[activeIndex]) ||
        (flattenedOptions.length === 1 ? flattenedOptions[0] : null);
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
        setInputValue(selectedLabel);
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

  let optionCursor = -1;

  return (
    <div
      ref={containerRef}
      className="tv-chord-type-picker"
      onBlur={handleBlur}
    >
      <input
        id={inputId}
        type="text"
        role="combobox"
        className="tv-chord-type-picker__input"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleInputKeyDown}
        aria-autocomplete="list"
        aria-expanded={isOpen && flattenedOptions.length > 0}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={activeOptionId}
        aria-haspopup="listbox"
        aria-labelledby={ariaLabelledBy}
      />
      {isOpen && (
        <ul id={listId} role="listbox" className="tv-chord-type-picker__list">
          {flattenedOptions.length === 0 ? (
            <li className="tv-chord-type-picker__empty" role="presentation">
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
                  return (
                    <li
                      key={option.type}
                      id={`${listId}-option-${optionIndex}`}
                      role="option"
                      aria-selected={option.type === selectedType}
                      className={clsx("tv-chord-type-picker__option", {
                        "is-active": optionIndex === activeIndex,
                        "is-selected": option.type === selectedType,
                        "is-microtonal": option.isMicrotonal,
                      })}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(optionIndex)}
                      onClick={() => commitSelection(option)}
                    >
                      <span className="tv-chord-type-picker__option-title">
                        {option.label}
                      </span>
                    </li>
                  );
                })}
              </Fragment>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
