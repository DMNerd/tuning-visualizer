import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import FloatingListbox from "@/components/UI/combobox/FloatingListbox";
import useCombobox from "@/hooks/useCombobox";
import useFilteredOptions from "@/hooks/useFilteredOptions";
import { createTextFit } from "@/utils/textFit";

const DEFAULT_VIRTUALIZATION_THRESHOLD = 100;
const DEFAULT_OPTION_HEIGHT = 40;
const MEASUREMENT_DELTA_PX = 2;
const WIDTH_BUCKET_SIZE = 8;
const OPTION_FONT_FAMILY =
  'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const OPTION_FONT_SIZE = 13;

function assignRef(ref, value) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  ref.current = value;
}

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
  virtualizationThreshold = DEFAULT_VIRTUALIZATION_THRESHOLD,
  enableVirtualization = true,
}) {
  const [listViewportHeight, setListViewportHeight] = useState(0);
  const [listViewportWidth, setListViewportWidth] = useState(0);
  const listElementRef = useRef(null);
  const measurementFrameRef = useRef(null);
  const pendingMeasurementRef = useRef(null);
  const latestViewportRef = useRef({ width: 0, height: 0 });
  const widthBucketRef = useRef(0);
  const rowHeightCacheRef = useRef(new Map());
  const textFit = useMemo(
    () => createTextFit({ fontFamily: OPTION_FONT_FAMILY }),
    [],
  );

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

  const [debouncedInputValue, setDebouncedInputValue] = useState("");

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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedInputValue(inputValue);
    }, 75);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [inputValue]);

  const { filteredOptions, normalizedQuery } = useFilteredOptions({
    options,
    inputValue: debouncedInputValue,
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

  const { className: inputClassName, ...restInputProps } = inputProps;

  const activeOptionId =
    isOpen && activeIndex >= 0 ? getOptionId(activeIndex) : undefined;

  const renderOptionItem = useCallback(
    (option, index, config = {}) => {
      const optionKey = getOptionKey(option);
      const isSelected = optionKey === selectedKey;
      const isActive = index === activeIndex;
      const optionProps = getOptionProps(index, {
        option,
        onSelect: () => commitSelection(option),
        ...config.optionProps,
      });

      return (
        <li
          key={config.key ?? optionKey}
          aria-selected={isSelected}
          {...optionProps}
          className={clsx(
            "tv-combobox__option",
            optionProps.className,
            config.className,
            {
              "is-active": isActive,
              "is-selected": isSelected,
            },
          )}
        >
          {config.content ??
            (typeof renderOption === "function"
              ? renderOption(option, {
                  isActive,
                  isSelected,
                  index,
                })
              : getOptionLabel(option))}
        </li>
      );
    },
    [
      getOptionKey,
      selectedKey,
      activeIndex,
      getOptionProps,
      commitSelection,
      renderOption,
      getOptionLabel,
    ],
  );

  const setListRef = useCallback(
    (node) => {
      listElementRef.current = node ?? null;
      assignRef(listProps?.ref, node ?? null);
    },
    [listProps],
  );

  const listContentWidth = Math.max(60, listViewportWidth - 20);
  const viewportWidthBucket = Math.max(
    WIDTH_BUCKET_SIZE,
    Math.round(listContentWidth / WIDTH_BUCKET_SIZE) * WIDTH_BUCKET_SIZE,
  );

  const applyMeasurement = useCallback((nextWidth, nextHeight) => {
    const previous = latestViewportRef.current;
    const hasWidthDelta =
      Math.abs(previous.width - nextWidth) >= MEASUREMENT_DELTA_PX;
    const hasHeightDelta =
      Math.abs(previous.height - nextHeight) >= MEASUREMENT_DELTA_PX;

    if (!hasWidthDelta && !hasHeightDelta) {
      return;
    }

    const nextViewport = {
      width: hasWidthDelta ? nextWidth : previous.width,
      height: hasHeightDelta ? nextHeight : previous.height,
    };

    latestViewportRef.current = nextViewport;

    if (hasWidthDelta) {
      setListViewportWidth(nextViewport.width);
    }
    if (hasHeightDelta) {
      setListViewportHeight(nextViewport.height);
    }
  }, []);

  const handleListMeasure = useCallback(
    ({ width, height }) => {
      pendingMeasurementRef.current = {
        width: width ?? 0,
        height: height ?? 0,
      };

      if (measurementFrameRef.current != null) {
        return;
      }

      measurementFrameRef.current = window.requestAnimationFrame(() => {
        measurementFrameRef.current = null;
        const measurement = pendingMeasurementRef.current;
        pendingMeasurementRef.current = null;

        if (!measurement) return;

        applyMeasurement(measurement.width, measurement.height);
      });
    },
    [applyMeasurement],
  );

  useEffect(
    () => () => {
      if (measurementFrameRef.current != null) {
        window.cancelAnimationFrame(measurementFrameRef.current);
      }
    },
    [],
  );

  const estimateOptionHeight = useCallback(
    (index) => {
      const option = filteredOptions[index];
      if (!option) return DEFAULT_OPTION_HEIGHT;

      const optionKey = getOptionKey(option);
      const label = getOptionLabel(option);
      if (!label) return DEFAULT_OPTION_HEIGHT;

      const cacheKey = `${optionKey}|${viewportWidthBucket}|${OPTION_FONT_SIZE}|${OPTION_FONT_FAMILY}`;
      const cached = rowHeightCacheRef.current.get(cacheKey);
      if (cached != null) return cached;

      const lineCount = textFit.estimateWrappedLines(label, listContentWidth, {
        lineHeight: 17,
        fontWeight: 500,
        fontSize: OPTION_FONT_SIZE,
        widthBucket: WIDTH_BUCKET_SIZE,
      });
      const estimatedHeight = Math.max(
        DEFAULT_OPTION_HEIGHT,
        16 + lineCount * 17,
      );
      rowHeightCacheRef.current.set(cacheKey, estimatedHeight);
      return estimatedHeight;
    },
    [
      filteredOptions,
      getOptionKey,
      getOptionLabel,
      listContentWidth,
      viewportWidthBucket,
      textFit,
    ],
  );

  useEffect(() => {
    rowHeightCacheRef.current.clear();
  }, [filteredOptions]);

  useEffect(() => {
    if (widthBucketRef.current === viewportWidthBucket) return;
    widthBucketRef.current = viewportWidthBucket;
    rowHeightCacheRef.current.clear();
  }, [viewportWidthBucket]);

  const shouldVirtualize =
    enableVirtualization &&
    filteredOptions.length > virtualizationThreshold &&
    listViewportHeight > 0 &&
    listViewportWidth > 0;

  const rowVirtualizer = useVirtualizer({
    count: filteredOptions.length,
    getScrollElement: () => listElementRef.current,
    estimateSize: estimateOptionHeight,
    overscan: 6,
    enabled: shouldVirtualize,
  });

  useEffect(() => {
    if (!isOpen || !shouldVirtualize || activeIndex < 0) return;
    rowVirtualizer.scrollToIndex(activeIndex, {
      align: "auto",
    });
  }, [isOpen, shouldVirtualize, activeIndex, rowVirtualizer]);

  const virtualItems = shouldVirtualize ? rowVirtualizer.getVirtualItems() : [];
  const virtualPaddingTop = virtualItems[0]?.start ?? 0;
  const lastVirtualItem = virtualItems[virtualItems.length - 1];
  const virtualPaddingBottom =
    shouldVirtualize && lastVirtualItem
      ? rowVirtualizer.getTotalSize() - lastVirtualItem.end
      : 0;

  const virtualization = useMemo(
    () => ({
      enabled: enableVirtualization,
      threshold: virtualizationThreshold,
      shouldVirtualize,
      viewportHeight: listViewportHeight,
      rowVirtualizer,
      listRef: setListRef,
      getVirtualItems: () => rowVirtualizer.getVirtualItems(),
    }),
    [
      enableVirtualization,
      virtualizationThreshold,
      shouldVirtualize,
      listViewportHeight,
      rowVirtualizer,
      setListRef,
    ],
  );

  const mergedListProps = useMemo(
    () => ({
      ...listProps,
      ref: setListRef,
    }),
    [listProps, setListRef],
  );

  return (
    <div
      {...rootProps}
      ref={rootRef}
      className={clsx("tv-combobox", className)}
    >
      <input
        {...restInputProps}
        id={inputId}
        type="text"
        role="combobox"
        className={clsx("tv-combobox__input", inputClassName)}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={inputValue}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={activeOptionId}
        aria-haspopup="listbox"
        aria-labelledby={ariaLabelledby}
      />
      {isOpen && (
        <FloatingListbox
          anchorRef={rootRef}
          isOpen={isOpen}
          onMeasure={handleListMeasure}
        >
          {typeof renderList === "function" ? (
            renderList({
              options: filteredOptions,
              activeIndex,
              getOptionProps,
              getOptionId,
              listId,
              listProps: mergedListProps,
              normalizedQuery,
              commitSelection,
              closeList,
              renderOptionItem,
              virtualization,
            })
          ) : (
            <ul
              {...mergedListProps}
              className={clsx("tv-combobox__list", listClassName)}
              style={shouldVirtualize ? { gap: 0 } : undefined}
            >
              {filteredOptions.length === 0 ? (
                <li className="tv-combobox__empty" role="presentation">
                  No matches.
                </li>
              ) : shouldVirtualize ? (
                <>
                  {virtualPaddingTop > 0 ? (
                    <li
                      role="presentation"
                      aria-hidden="true"
                      style={{ height: virtualPaddingTop, padding: 0 }}
                    />
                  ) : null}
                  {virtualItems.map((item) =>
                    renderOptionItem(filteredOptions[item.index], item.index, {
                      key: getOptionKey(filteredOptions[item.index]),
                      optionProps: {
                        ref: rowVirtualizer.measureElement,
                        "data-index": item.index,
                      },
                    }),
                  )}
                  {virtualPaddingBottom > 0 ? (
                    <li
                      role="presentation"
                      aria-hidden="true"
                      style={{ height: virtualPaddingBottom, padding: 0 }}
                    />
                  ) : null}
                </>
              ) : (
                filteredOptions.map((option, index) =>
                  renderOptionItem(option, index),
                )
              )}
            </ul>
          )}
        </FloatingListbox>
      )}
    </div>
  );
}
