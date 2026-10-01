import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useClickAway, useLatest, useKey } from "react-use";

const OPTION_KEY_FIELDS = ["value", "id", "key"];
const hasOwn = (obj, name) => Object.prototype.hasOwnProperty.call(obj, name);

function defaultGetOptionKey(option) {
  if (!option || typeof option !== "object") return option;
  const field = OPTION_KEY_FIELDS.find((name) => hasOwn(option, name));
  return field ? option[field] : option;
}

export default function useCombobox({
  id,
  selectedKey,
  getOptionKey = defaultGetOptionKey,
  selectedText = "",
  initialInputValue = "",
} = {}) {
  const fallbackId = useId();
  const inputId = id ?? `combobox-${fallbackId}`;
  const listId = `${inputId}-list`;

  const rootRef = useRef(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const optionsRef = useRef([]);
  const allowCycleRef = useRef(true);
  const onCommitRef = useRef(null);
  const onKeyDownPropRef = useRef(null);
  const isOpenRef = useRef(false);

  const getOptionKeyRef = useLatest(getOptionKey);
  const selectedKeyRef = useLatest(selectedKey ?? null);
  const selectedTextRef = useLatest(selectedText ?? "");

  const [inputValue, setInputValue] = useState(
    initialInputValue ?? selectedTextRef.current ?? "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const getKey = useCallback(
    (option) => getOptionKeyRef.current(option),
    [getOptionKeyRef],
  );

  const getListElement = useCallback(() => {
    return listRef.current ?? document.getElementById(listId) ?? null;
  }, [listId]);

  const scrollActiveIntoView = useCallback(
    (index) => {
      if (index < 0) return;
      const listEl = getListElement();
      if (!listEl) return;
      const optionEl = listEl.querySelector(`#${listId}-option-${index}`);
      if (!optionEl) return;
      // Scroll only the list: scrollIntoView would also scroll the page when
      // the list overflows the viewport, sliding a row under the pointer,
      // whose mouseenter then steals the active index.
      const listRect = listEl.getBoundingClientRect();
      const optionRect = optionEl.getBoundingClientRect();
      if (optionRect.top < listRect.top) {
        listEl.scrollTop -= listRect.top - optionRect.top;
      } else if (optionRect.bottom > listRect.bottom) {
        listEl.scrollTop += optionRect.bottom - listRect.bottom;
      }
    },
    [getListElement, listId],
  );

  const clampIndex = useCallback((index) => {
    const total = optionsRef.current.length;
    if (!total) return -1;
    if (index < 0) return 0;
    if (index >= total) return total - 1;
    return index;
  }, []);

  const syncActiveIndex = useCallback(
    (options = optionsRef.current, selected = selectedKeyRef.current) => {
      const list = Array.isArray(options) ? options : [];
      const total = list.length;
      setActiveIndex((prev) => {
        if (!total) return -1;
        if (prev >= 0 && prev < total) return prev;
        if (selected != null) {
          const selectedIdx = list.findIndex(
            (option) => getKey(option) === selected,
          );
          if (selectedIdx >= 0) return selectedIdx;
        }
        return 0;
      });
    },
    [getKey, selectedKeyRef],
  );

  const closeList = useCallback(
    ({ restoreInputValue = selectedTextRef.current } = {}) => {
      setIsOpen(false);
      setActiveIndex(-1);
      setIsFiltering(false);
      if (restoreInputValue !== undefined) {
        setInputValue(restoreInputValue);
      }
    },
    [selectedTextRef],
  );

  const openList = useCallback(() => {
    setIsOpen(true);
  }, []);

  const setOptions = useCallback(
    (options, { selected: nextSelected } = {}) => {
      const safe = Array.isArray(options) ? options : [];
      optionsRef.current = safe;
      if (typeof nextSelected !== "undefined") {
        selectedKeyRef.current = nextSelected ?? null;
      }
      if (isOpenRef.current) {
        syncActiveIndex(safe, selectedKeyRef.current);
      }
    },
    [selectedKeyRef, syncActiveIndex],
  );

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }
    syncActiveIndex(optionsRef.current, selectedKeyRef.current);
  }, [isOpen, selectedKeyRef, syncActiveIndex]);

  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      scrollActiveIntoView(activeIndex);
    }
  }, [isOpen, activeIndex, scrollActiveIntoView]);

  // Floating lists mount a commit after opening (once positioned), after the
  // effect above already ran, so scroll again when the list element attaches.
  const activeIndexRef = useLatest(activeIndex);
  const setListElement = useCallback(
    (node) => {
      listRef.current = node;
      if (node) scrollActiveIntoView(activeIndexRef.current);
    },
    [activeIndexRef, scrollActiveIntoView],
  );

  const handleClickAway = useCallback(
    (event) => {
      if (!isOpenRef.current) return;
      const target = event.target;
      const root = rootRef.current;
      if (root?.contains(target)) return;
      const listEl = getListElement();
      if (listEl?.contains(target)) return;

      if (typeof event.composedPath === "function") {
        const path = event.composedPath();
        if (Array.isArray(path)) {
          if (root && path.includes(root)) return;
          if (listEl && path.includes(listEl)) return;
        }
      }
      closeList();
    },
    [closeList, getListElement],
  );

  useClickAway(rootRef, handleClickAway);

  const handleBlur = useCallback(() => {
    requestAnimationFrame(() => {
      const root = rootRef.current;
      if (!root) return;
      const activeEl = document.activeElement;
      const listEl = getListElement();
      const isFocusWithinRoot = activeEl && root.contains(activeEl);
      const isFocusWithinList = activeEl && listEl?.contains(activeEl);
      if (!isFocusWithinRoot && !isFocusWithinList) {
        closeList();
      }
    });
  }, [closeList, getListElement]);

  const getOptionId = useCallback(
    (index) => `${listId}-option-${index}`,
    [listId],
  );

  const preventBlur = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const getOptionProps = useCallback(
    (index, { option, disabled, onSelect, onMouseEnter } = {}) => ({
      id: getOptionId(index),
      role: "option",
      tabIndex: -1,
      "aria-disabled": disabled ? true : undefined,
      onMouseDown: preventBlur,
      onPointerDown: preventBlur,
      onTouchStart: preventBlur,
      onMouseEnter: (event) => {
        if (!disabled) {
          const clamped = clampIndex(index);
          setActiveIndex(clamped);
        }
        onMouseEnter?.(event);
      },
      onClick: (event) => {
        if (disabled) return;
        onSelect?.(option, index, event);
      },
    }),
    [getOptionId, clampIndex, preventBlur],
  );

  const commitSelection = useCallback(
    ({ inputValue: nextInputValue, keepOpen = false, optionIndex } = {}) => {
      if (typeof nextInputValue !== "undefined") {
        setInputValue(nextInputValue);
      }
      setIsFiltering(false);
      if (!keepOpen) {
        setIsOpen(false);
        setActiveIndex(-1);
      } else if (typeof optionIndex === "number") {
        const clamped = clampIndex(optionIndex);
        setActiveIndex(clamped);
      }
    },
    [clampIndex],
  );

  const handleInputRef = useCallback((node) => {
    inputRef.current = node ?? null;
  }, []);

  const shouldFilterBasedOnInput = useCallback(() => {
    const currentValue = inputRef.current?.value ?? inputValue ?? "";
    const selectedText = selectedTextRef.current ?? "";
    return Boolean(currentValue) && currentValue !== selectedText;
  }, [inputValue, selectedTextRef]);

  const syncFilteringStateFromInput = useCallback(() => {
    setIsFiltering(shouldFilterBasedOnInput());
  }, [shouldFilterBasedOnInput]);

  const handleInputPress = useCallback(() => {
    syncFilteringStateFromInput();
    const wasOpen = isOpenRef.current;
    setIsOpen(true);
    if (!wasOpen) syncActiveIndex(optionsRef.current, selectedKeyRef.current);
  }, [syncFilteringStateFromInput, syncActiveIndex, selectedKeyRef]);

  const getInputProps = useCallback(
    ({ onCommit, allowCycle = true, onChange, onFocus, onKeyDown } = {}) => {
      allowCycleRef.current = allowCycle !== false;
      onCommitRef.current = onCommit ?? null;
      onKeyDownPropRef.current = onKeyDown ?? null;
      return {
        ref: handleInputRef,
        onChange: (event) => {
          setInputValue(event.target.value);
          setIsFiltering(true);
          setIsOpen(true);
          // A new query highlights the top match rather than whatever row
          // index was active before filtering.
          setActiveIndex(0);
          onChange?.(event);
        },
        onFocus: (event) => {
          handleInputPress();
          onFocus?.(event);
        },
        onPointerDown: handleInputPress,
        onTouchStart: handleInputPress,
        onMouseDown: handleInputPress,
        onKeyDown: (event) => {
          if (!event.defaultPrevented) {
            onKeyDownPropRef.current?.(event);
          }
        },
      };
    },
    [handleInputRef, handleInputPress],
  );

  const moveActiveIndex = (event, step) => {
    event.preventDefault();
    setIsOpen(true);
    setActiveIndex((prev) => {
      const total = optionsRef.current.length;
      if (!total) return -1;
      const first = step > 0 ? 0 : total - 1;
      const last = total - 1 - first;
      const inRange = prev >= 0 && prev < total;
      const next = inRange ? prev + step : first;
      if (next < 0 || next >= total) {
        return allowCycleRef.current ? first : last;
      }
      return next;
    });
  };

  const jumpActiveIndex = (event, toEnd) => {
    event.preventDefault();
    setIsOpen(true);
    const total = optionsRef.current.length;
    setActiveIndex(total ? (toEnd ? total - 1 : 0) : -1);
  };

  const handleEnter = (event) => {
    const options = optionsRef.current;
    if (!isOpenRef.current) {
      event.preventDefault();
      setIsOpen(true);
      syncFilteringStateFromInput();
      syncActiveIndex(options, selectedKeyRef.current);
      return;
    }
    const total = options.length;
    const index =
      activeIndex >= 0 && activeIndex < total
        ? activeIndex
        : total === 1
          ? 0
          : -1;
    const option = index >= 0 ? options[index] : undefined;
    if (option) {
      event.preventDefault();
      onCommitRef.current?.(option, index, event);
    }
  };

  const handleEscape = (event) => {
    event.preventDefault();
    if (isOpenRef.current) {
      closeList();
    } else {
      setInputValue(selectedTextRef.current);
      setIsFiltering(false);
    }
  };

  // Rebuilt every render (like useKey's own handler) so Enter sees the
  // current activeIndex.
  const keyHandlers = {
    ArrowDown: (event) => moveActiveIndex(event, 1),
    ArrowUp: (event) => moveActiveIndex(event, -1),
    Home: (event) => jumpActiveIndex(event, false),
    End: (event) => jumpActiveIndex(event, true),
    Enter: handleEnter,
    Escape: handleEscape,
  };

  useKey(
    (event) =>
      event.target === inputRef.current && hasOwn(keyHandlers, event.key),
    (event) => keyHandlers[event.key](event),
  );

  const listProps = useMemo(
    () => ({
      id: listId,
      role: "listbox",
      ref: setListElement,
    }),
    [listId, setListElement],
  );

  const rootProps = useMemo(
    () => ({
      onBlur: handleBlur,
    }),
    [handleBlur],
  );

  return {
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
    setActiveIndex,
    openList,
    closeList,
    getInputProps,
    getOptionId,
    getOptionProps,
    listRef,
    listProps,
    commitSelection,
    setOptions,
  };
}
