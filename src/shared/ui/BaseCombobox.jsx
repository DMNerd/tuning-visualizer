import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { FiStar } from "react-icons/fi";
import FloatingListbox from "@shared/ui/FloatingListbox";
import useCombobox from "@shared/hooks/useCombobox";
import useFilteredOptions from "@shared/hooks/useFilteredOptions";
import useVirtualListSizing from "@shared/hooks/useVirtualListSizing";
import { liftFavorites } from "@shared/lib/favorites";
import {
  selectFavoriteKeys,
  selectToggleFavorite,
  useFavoritesStore,
} from "@shared/store/useFavoritesStore";

const DEFAULT_VIRTUALIZATION_THRESHOLD = 100;

function assignRef(ref, value) {
  if (!ref) return;
  if (typeof ref === "function") {
    ref(value);
    return;
  }
  ref.current = value;
}

const preventFocusSteal = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

// Fills the scrolled-past (or not-yet-rendered) height of a virtualized list.
export function VirtualSpacer({ height }) {
  if (!(height > 0)) return null;
  return (
    <li role="presentation" aria-hidden="true" style={{ height, padding: 0 }} />
  );
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
  optionClassName,
  emptyText,
  virtualizationThreshold = DEFAULT_VIRTUALIZATION_THRESHOLD,
  enableVirtualization = true,
  orderFilteredOptions,
  // Store scope for starred options; enables the star toggle and lifts
  // favourites to the top of the unfiltered list.
  favoritesScope,
  canFavorite,
}) {
  const { t } = useTranslation();
  const favoriteKeys = useFavoritesStore(
    selectFavoriteKeys(favoritesScope ?? ""),
  );
  const toggleFavorite = useFavoritesStore(selectToggleFavorite);
  const favoriteKeySet = useMemo(() => new Set(favoriteKeys), [favoriteKeys]);
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

  const listElementRef = useRef(null);
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

  const { filteredOptions: matchedOptions, normalizedQuery } =
    useFilteredOptions({
      options,
      inputValue: debouncedInputValue,
      isFiltering,
      getFilterTerms,
    });
  // Lets grouped lists restore group order after fuzzy search re-sorts
  // matches, so keyboard navigation follows the rendered order.
  const orderedOptions = useMemo(
    () =>
      typeof orderFilteredOptions === "function"
        ? orderFilteredOptions(matchedOptions)
        : matchedOptions,
    [orderFilteredOptions, matchedOptions],
  );

  // Order by the favourites as they were when the list opened, so starring
  // a row doesn't move it out from under the pointer.
  const [openFavoriteKeySet, setOpenFavoriteKeySet] = useState(null);
  if (isOpen && openFavoriteKeySet === null) {
    setOpenFavoriteKeySet(favoriteKeySet);
  } else if (!isOpen && openFavoriteKeySet !== null) {
    setOpenFavoriteKeySet(null);
  }
  const orderingFavoriteKeySet = openFavoriteKeySet ?? favoriteKeySet;

  // Search results keep relevance order; favourites only lead the full list.
  const { options: filteredOptions, favoriteCount } = useMemo(
    () =>
      favoritesScope && !normalizedQuery
        ? liftFavorites(
            orderedOptions,
            (option) =>
              (canFavorite?.(option) ?? true) &&
              orderingFavoriteKeySet.has(getOptionKey(option)),
          )
        : { options: orderedOptions, favoriteCount: 0 },
    [
      favoritesScope,
      normalizedQuery,
      orderedOptions,
      orderingFavoriteKeySet,
      getOptionKey,
      canFavorite,
    ],
  );

  useEffect(() => {
    setOptions(filteredOptions);
  }, [filteredOptions, setOptions]);

  const {
    listViewportWidth,
    listViewportHeight,
    handleListMeasure,
    estimateOptionHeight,
  } = useVirtualListSizing({
    options: filteredOptions,
    getOptionKey,
    getOptionLabel,
  });

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
      const isFavorite = favoriteKeySet.has(optionKey);
      const showFavoriteToggle =
        Boolean(favoritesScope) && (canFavorite?.(option) ?? true);
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
              "has-favorite-toggle": showFavoriteToggle,
            },
          )}
        >
          {config.content ??
            (typeof renderOption === "function"
              ? renderOption(option, {
                  isActive,
                  isSelected,
                  index,
                  inFavorites: index < favoriteCount,
                })
              : getOptionLabel(option))}
          {showFavoriteToggle ? (
            <button
              type="button"
              className={clsx("tv-combobox__favorite", {
                "is-favorite": isFavorite,
              })}
              tabIndex={-1}
              aria-pressed={isFavorite}
              aria-label={t(
                isFavorite ? "common.unfavoriteAria" : "common.favoriteAria",
                { name: getOptionLabel(option) },
              )}
              title={t(isFavorite ? "common.unfavorite" : "common.favorite")}
              onMouseDown={preventFocusSteal}
              onPointerDown={preventFocusSteal}
              onClick={(event) => {
                event.stopPropagation();
                toggleFavorite(favoritesScope, optionKey);
              }}
            >
              <FiStar aria-hidden />
            </button>
          ) : null}
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
      favoriteKeySet,
      favoriteCount,
      favoritesScope,
      canFavorite,
      toggleFavorite,
      t,
    ],
  );

  const setListRef = useCallback(
    (node) => {
      listElementRef.current = node ?? null;
      assignRef(listProps?.ref, node ?? null);
    },
    [listProps],
  );

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
      paddingTop: virtualPaddingTop,
      paddingBottom: virtualPaddingBottom,
    }),
    [
      enableVirtualization,
      virtualizationThreshold,
      shouldVirtualize,
      listViewportHeight,
      rowVirtualizer,
      setListRef,
      virtualPaddingTop,
      virtualPaddingBottom,
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
              favoriteCount,
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
              aria-labelledby={ariaLabelledby}
              style={shouldVirtualize ? { gap: 0 } : undefined}
            >
              {filteredOptions.length === 0 ? (
                <li
                  className="tv-combobox__empty"
                  role="presentation"
                  aria-live="polite"
                >
                  {emptyText ?? t("common.noMatches")}
                </li>
              ) : shouldVirtualize ? (
                <>
                  <VirtualSpacer height={virtualPaddingTop} />
                  {virtualItems.map((item) =>
                    renderOptionItem(filteredOptions[item.index], item.index, {
                      className: optionClassName,
                      optionProps: {
                        ref: rowVirtualizer.measureElement,
                        "data-index": item.index,
                      },
                    }),
                  )}
                  <VirtualSpacer height={virtualPaddingBottom} />
                </>
              ) : (
                filteredOptions.map((option, index) => (
                  <Fragment key={getOptionKey(option)}>
                    {favoriteCount > 0 && index === 0 ? (
                      <li role="presentation" className="tv-combobox__group">
                        {t("common.favorites")}
                      </li>
                    ) : null}
                    {favoriteCount > 0 && index === favoriteCount ? (
                      <li role="presentation" className="tv-combobox__group">
                        {t("common.all")}
                      </li>
                    ) : null}
                    {renderOptionItem(option, index, {
                      className: optionClassName,
                    })}
                  </Fragment>
                ))
              )}
            </ul>
          )}
        </FloatingListbox>
      )}
    </div>
  );
}
