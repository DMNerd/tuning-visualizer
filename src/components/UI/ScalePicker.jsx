import { useCallback, useEffect, useMemo, useRef } from "react";
import clsx from "clsx";
import FloatingListbox from "@/components/UI/FloatingListbox";
import useCombobox from "@/hooks/useCombobox";

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
  const inputRef = useRef(null);
  const selectedOption = useMemo(
    () => scaleOptions.find((option) => option.label === scale) ?? null,
    [scaleOptions, scale],
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
    setIsOpen,
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
    selectedKey: selectedLabel,
    getOptionKey: (option) => option?.label,
    selectedText: selectedLabel,
    initialInputValue: selectedLabel,
  });

  useEffect(() => {
    if (!scaleOptions.length) {
      setInputValue("");
      setIsFiltering(false);
      setIsOpen(false);
      return;
    }

    const nextLabel = selectedOption?.label ?? scaleOptions[0]?.label ?? "";
    setInputValue(nextLabel);
    setIsFiltering(false);
    setIsOpen(false);
  }, [scaleOptions, selectedOption, setInputValue, setIsFiltering, setIsOpen]);

  const filteredOptions = useMemo(() => {
    const text = isFiltering ? normalize(inputValue) : "";
    if (!text) return scaleOptions;

    return scaleOptions.filter((option) => {
      const label = normalize(option.label);
      const system = normalize(option.systemId);
      return label.includes(text) || system.includes(text);
    });
  }, [inputValue, isFiltering, scaleOptions]);

  useEffect(() => {
    setOptions(filteredOptions);
  }, [filteredOptions, setOptions]);

  const commitSelection = useCallback(
    (option) => {
      if (!option) return;
      setScale(option.label);
      setInputValue(option.label);
      commitComboboxSelection({ inputValue: option.label });
      requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
      });
    },
    [commitComboboxSelection, setInputValue, setScale],
  );

  const inputProps = getInputProps({
    onCommit: (option) => commitSelection(option),
  });

  const activeOptionId =
    isOpen && activeIndex >= 0 ? getOptionId(activeIndex) : undefined;

  return (
    <div
      {...rootProps}
      ref={rootRef}
      className={clsx("tv-combobox", "tv-scale-picker", className)}
    >
      <input
        id={inputId}
        type="text"
        className="tv-combobox__input"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={isOpen ? activeOptionId : undefined}
        aria-labelledby={ariaLabelledby}
        value={inputValue}
        onChange={inputProps.onChange}
        onFocus={inputProps.onFocus}
        onKeyDown={inputProps.onKeyDown}
        ref={(node) => {
          inputRef.current = node;
          inputProps.ref?.(node);
        }}
        autoComplete="off"
        spellCheck="false"
      />
      {isOpen && (
        <FloatingListbox anchorRef={rootRef} isOpen={isOpen}>
          <div className="tv-scale-picker__popover">
            <ul
              {...listProps}
              className="tv-combobox__list tv-scale-picker__list"
              aria-labelledby={ariaLabelledby}
            >
              {filteredOptions.length === 0 ? (
                <li
                  className="tv-combobox__empty tv-scale-picker__empty"
                  aria-live="polite"
                >
                  No matching scales
                </li>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.label === selectedOption?.label;
                  const optionProps = getOptionProps(index, {
                    option,
                    onSelect: () => commitSelection(option),
                  });
                  return (
                    <li
                      {...optionProps}
                      key={`${option.systemId}-${option.label}`}
                      aria-selected={isSelected}
                      data-active={index === activeIndex || undefined}
                      className="tv-combobox__option tv-scale-picker__option"
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
