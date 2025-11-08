import React from "react";
import clsx from "clsx";
import FloatingListbox from "./FloatingListbox";

function normalize(value) {
  return value?.toString().trim().toLowerCase() ?? "";
}

function ScalePicker({
  id,
  className,
  scaleOptions = [],
  scale,
  setScale,
  "aria-labelledby": ariaLabelledby,
}) {
  const inputRef = React.useRef(null);
  const wrapperRef = React.useRef(null);
  const listboxId = React.useId();

  const selectedOption = React.useMemo(
    () => scaleOptions.find((option) => option.label === scale) ?? null,
    [scaleOptions, scale],
  );

  const [inputValue, setInputValue] = React.useState(
    selectedOption?.label ?? "",
  );
  const [isFiltering, setIsFiltering] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const filteredOptions = React.useMemo(() => {
    const text = isFiltering ? normalize(inputValue) : "";
    if (!text) return scaleOptions;

    return scaleOptions.filter((option) => {
      const label = normalize(option.label);
      const system = normalize(option.systemId);
      return label.includes(text) || system.includes(text);
    });
  }, [inputValue, isFiltering, scaleOptions]);

  React.useEffect(() => {
    if (!scaleOptions.length) {
      setInputValue("");
      setIsFiltering(false);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    const nextLabel = selectedOption?.label ?? scaleOptions[0]?.label ?? "";
    setInputValue(nextLabel);
    setIsFiltering(false);
    setActiveIndex(-1);
    setIsOpen(false);
  }, [scaleOptions, selectedOption]);

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (wrapperRef.current?.contains(event.target)) return;
      const listEl = document.getElementById(listboxId);
      if (listEl?.contains(event.target)) return;
      setIsOpen(false);
      setInputValue(selectedOption?.label ?? "");
      setIsFiltering(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, listboxId, selectedOption]);

  React.useEffect(() => {
    if (!filteredOptions.length) {
      setActiveIndex(-1);
      return;
    }

    setActiveIndex((prev) => {
      if (prev < 0) {
        if (!isOpen && selectedOption) {
          const selectedIndex = filteredOptions.findIndex(
            (option) => option.label === selectedOption.label,
          );
          if (selectedIndex >= 0) return selectedIndex;
        }
        return 0;
      }

      if (prev >= filteredOptions.length) {
        return filteredOptions.length - 1;
      }

      return prev;
    });
  }, [filteredOptions, isOpen, selectedOption]);

  const openListbox = React.useCallback(() => {
    setIsOpen(true);
    setActiveIndex((prev) => {
      if (prev >= 0 && prev < filteredOptions.length) return prev;

      if (selectedOption) {
        const selectedIndex = filteredOptions.findIndex(
          (option) => option.label === selectedOption.label,
        );
        if (selectedIndex >= 0) return selectedIndex;
      }

      return filteredOptions.length ? 0 : -1;
    });
  }, [filteredOptions, selectedOption]);

  const handleSelect = React.useCallback(
    (option) => {
      if (!option) return;
      setScale(option.label);
      setInputValue(option.label);
      setIsFiltering(false);
      setIsOpen(false);
      requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
      });
    },
    [setScale],
  );

  const handleKeyDown = React.useCallback(
    (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!isOpen) {
          openListbox();
          return;
        }
        setActiveIndex((prev) => {
          if (!filteredOptions.length) return -1;
          const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
          return next;
        });
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!isOpen) {
          openListbox();
          return;
        }
        setActiveIndex((prev) => {
          if (!filteredOptions.length) return -1;
          const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
          return next;
        });
        return;
      }

      if (event.key === "Enter") {
        if (!isOpen) {
          event.preventDefault();
          openListbox();
          return;
        }

        const option = filteredOptions[activeIndex];
        if (option) {
          event.preventDefault();
          handleSelect(option);
        }
        return;
      }

      if (event.key === "Escape") {
        if (isOpen) {
          event.preventDefault();
          setIsOpen(false);
          setInputValue(selectedOption?.label ?? "");
          setIsFiltering(false);
        }
        return;
      }

      if (event.key === "Tab") {
        setIsOpen(false);
        setInputValue(selectedOption?.label ?? inputValue);
        setIsFiltering(false);
      }
    },
    [
      activeIndex,
      filteredOptions,
      handleSelect,
      isOpen,
      openListbox,
      inputValue,
      selectedOption,
    ],
  );

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
    setIsFiltering(true);
    if (!isOpen) {
      openListbox();
    }
  };

  const activeOption = filteredOptions[activeIndex];
  const activeOptionId = activeOption
    ? `${listboxId}-option-${filteredOptions.indexOf(activeOption)}`
    : undefined;

  return (
    <div className={clsx("tv-scale-picker", className)} ref={wrapperRef}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        className="tv-scale-picker__input"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={isOpen ? activeOptionId : undefined}
        aria-labelledby={ariaLabelledby}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={openListbox}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck="false"
      />
      {isOpen && (
        <FloatingListbox anchorRef={wrapperRef} isOpen={isOpen}>
          <div className="tv-scale-picker__popover">
            <ul
              id={listboxId}
              role="listbox"
              className="tv-scale-picker__list"
              aria-labelledby={ariaLabelledby}
            >
              {filteredOptions.length === 0 ? (
                <li className="tv-scale-picker__empty" aria-live="polite">
                  No matching scales
                </li>
              ) : (
                filteredOptions.map((option, index) => {
                  const optionId = `${listboxId}-option-${index}`;
                  const isActive = index === activeIndex;
                  const isSelected = option.label === selectedOption?.label;

                  return (
                    <li
                      key={`${option.systemId}-${option.label}`}
                      id={optionId}
                      role="option"
                      aria-selected={isSelected}
                      data-active={isActive || undefined}
                      className="tv-scale-picker__option"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(option)}
                    >
                      <span className="tv-scale-picker__option-label">
                        {option.label}
                      </span>
                      {option.systemId ? (
                        <span className="tv-scale-picker__option-meta">
                          {option.systemId}
                        </span>
                      ) : null}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </FloatingListbox>
      )}
    </div>
  );
}

export default ScalePicker;
