import { useCallback, useEffect, useMemo, useRef } from "react";
import clsx from "clsx";
import FloatingListbox from "@/components/UI/combobox/FloatingListbox";
import useCombobox from "@/hooks/useCombobox";
import useFilteredOptions from "@/hooks/useFilteredOptions";

export default function BaseCombobox({
  id,
  value,
  onSelect,
  options = [],
  getOptionKey = (option) => option?.value ?? option?.label ?? option,
  getOptionLabel = (option) => option?.label ?? String(option ?? ""),
  getFilterTerms,
  renderOption,
  renderList,
  placeholder = "",
  "aria-labelledby": ariaLabelledby,
  className,
  listClassName,
}) {
  const selectedOption = useMemo(() => {
    if (value == null) return null;
    return (
      options.find((opt) => {
        const k = getOptionKey(opt);
        return k === value || getOptionLabel(opt) === value;
      }) ?? null
    );
  }, [options, value, getOptionKey, getOptionLabel]);

  const selectedKey = useMemo(() => {
    if (selectedOption) {
      return getOptionKey(selectedOption);
    }

    return value ?? null;
  }, [selectedOption, getOptionKey, value]);

  const selectedLabel = selectedOption
    ? getOptionLabel(selectedOption)
    : value
      ? String(value)
      : "";

  const previousSelectionRef = useRef({
    key: selectedKey ?? null,
    label: selectedLabel,
  });

  const {
    rootRef,
    rootProps,
    inputId,
    listId,
    inputValue,
    setInputValue,
    isOpen,
    isFiltering,
    activeIndex,
    getInputProps,
    getOptionId,
    getOptionProps,
    commitSelection: commitComboboxSelection,
    closeList,
    setOptions,
    listProps,
  } = useCombobox({
    id,
    selectedKey,
    getOptionKey: (opt) => getOptionKey(opt),
    selectedText: selectedLabel,
    initialInputValue: selectedLabel,
  });

  const { filteredOptions, normalizedQuery } = useFilteredOptions({
    options,
    inputValue,
    isFiltering,
    getFilterTerms,
  });

  useEffect(() => {
    setOptions(filteredOptions);
  }, [filteredOptions, setOptions]);

  useEffect(() => {
    const nextSelection = {
      key: selectedKey ?? null,
      label: selectedLabel,
    };

    const previousSelection = previousSelectionRef.current;
    const hasSelectionChanged =
      previousSelection.key !== nextSelection.key ||
      previousSelection.label !== nextSelection.label;

    if (!hasSelectionChanged) {
      return;
    }

    previousSelectionRef.current = nextSelection;

    if (nextSelection.key == null) {
      closeList({ restoreInputValue: "" });
      setInputValue("");
      return;
    }

    setInputValue(nextSelection.label ?? "");
  }, [selectedKey, selectedLabel, closeList, setInputValue]);

  const commitSelection = useCallback(
    (option) => {
      if (!option) return;
      const label = getOptionLabel(option);
      onSelect?.(option, { label, key: getOptionKey(option) });
      setInputValue(label);
      commitComboboxSelection({ inputValue: label });
    },
    [
      onSelect,
      getOptionLabel,
      getOptionKey,
      setInputValue,
      commitComboboxSelection,
    ],
  );

  const inputProps = getInputProps({
    onCommit: (option) => {
      if (!option) return;
      commitSelection(option);
    },
  });

  const activeOptionId =
    isOpen && activeIndex >= 0 ? getOptionId(activeIndex) : undefined;

  return (
    <div
      {...rootProps}
      ref={rootRef}
      className={clsx("tv-combobox", className)}
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
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={activeOptionId}
        aria-haspopup="listbox"
        aria-labelledby={ariaLabelledby}
      />
      {isOpen && (
        <FloatingListbox anchorRef={rootRef} isOpen={isOpen}>
          {typeof renderList === "function" ? (
            renderList({
              options: filteredOptions,
              activeIndex,
              getOptionProps,
              getOptionId,
              listId,
              listProps,
              normalizedQuery,
              commitSelection,
              closeList,
            })
          ) : (
            <ul
              {...listProps}
              className={clsx("tv-combobox__list", listClassName)}
            >
              {filteredOptions.length === 0 ? (
                <li className="tv-combobox__empty" role="presentation">
                  No matches.
                </li>
              ) : (
                filteredOptions.map((option, index) => {
                  const optionKey = getOptionKey(option);
                  const isSelected = optionKey === selectedKey;
                  const optionProps = getOptionProps(index, {
                    option,
                    onSelect: () => commitSelection(option),
                  });
                  return (
                    <li
                      key={optionKey}
                      aria-selected={isSelected}
                      {...optionProps}
                      className={clsx(
                        "tv-combobox__option",
                        optionProps.className,
                        {
                          "is-active": index === activeIndex,
                          "is-selected": isSelected,
                        },
                      )}
                    >
                      {typeof renderOption === "function"
                        ? renderOption(option, {
                            isActive: index === activeIndex,
                          })
                        : getOptionLabel(option)}
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </FloatingListbox>
      )}
    </div>
  );
}
