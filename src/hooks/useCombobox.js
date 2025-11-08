import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useClickAway, useLatest, useKey } from "react-use";

function defaultGetOptionKey(option) {
  if (option && typeof option === "object") {
    if (Object.prototype.hasOwnProperty.call(option, "value")) {
      return option.value;
    }
    if (Object.prototype.hasOwnProperty.call(option, "id")) {
      return option.id;
    }
    if (Object.prototype.hasOwnProperty.call(option, "key")) {
      return option.key;
    }
  }
  return option;
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
  const getOptionKeyRef = useLatest(getOptionKey);
  const selectedKeyRef = useLatest(selectedKey ?? null);
  const selectedTextRef = useLatest(selectedText ?? "");

  const [inputValue, setInputValue] = useState(
    initialInputValue ?? selectedTextRef.current ?? "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const getKey = useCallback(
    (option) => getOptionKeyRef.current(option),
    [getOptionKeyRef],
  );

  const syncActiveIndex = useCallback(
    (options = optionsRef.current, selected = selectedKeyRef.current) => {
      const list = Array.isArray(options) ? options : [];
      const selectedValue = selected;
      setActiveIndex((prev) => {
        if (!list.length) return -1;
        if (prev >= 0 && prev < list.length) return prev;
        if (selectedValue != null) {
          const selectedIdx = list.findIndex(
            (option) => getKey(option) === selectedValue,
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
      optionsRef.current = Array.isArray(options) ? options : [];
      if (typeof nextSelected !== "undefined") {
        selectedKeyRef.current = nextSelected ?? null;
      }
      if (isOpen) {
        syncActiveIndex(optionsRef.current, selectedKeyRef.current);
      }
    },
    [isOpen, selectedKeyRef, syncActiveIndex],
  );

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }
    syncActiveIndex(optionsRef.current, selectedKeyRef.current);
  }, [isOpen, selectedKeyRef, syncActiveIndex]);

  const handleClickAway = useCallback(
    (event) => {
      if (!isOpen) return;
      const target = event.target;
      const root = rootRef.current;
      if (root?.contains(target)) return;
      const listEl = listRef.current ?? document.getElementById(listId);
      if (listEl?.contains(target)) return;
      closeList();
    },
    [closeList, isOpen, listId],
  );

  useClickAway(rootRef, handleClickAway, ["pointerdown"]);

  const handleBlur = useCallback(() => {
    requestAnimationFrame(() => {
      const root = rootRef.current;
      if (!root) return;
      const activeEl = document.activeElement;
      const listEl = listRef.current ?? document.getElementById(listId);
      const isFocusWithinRoot = activeEl && root.contains(activeEl);
      const isFocusWithinList = activeEl && listEl?.contains(activeEl);
      if (!isFocusWithinRoot && !isFocusWithinList) {
        closeList();
      }
    });
  }, [closeList, listId]);

  const getOptionId = useCallback(
    (index) => `${listId}-option-${index}`,
    [listId],
  );

  const getOptionProps = useCallback(
    (index, { option, disabled, onSelect, onMouseEnter } = {}) => ({
      id: getOptionId(index),
      role: "option",
      tabIndex: -1,
      "aria-disabled": disabled ? true : undefined,
      onMouseDown: (event) => event.preventDefault(),
      onMouseEnter: (event) => {
        if (!disabled) {
          setActiveIndex(index);
        }
        onMouseEnter?.(event);
      },
      onClick: (event) => {
        if (disabled) return;
        onSelect?.(option, index, event);
      },
    }),
    [getOptionId],
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
        setActiveIndex(optionIndex);
      }
    },
    [],
  );

  const handleInputRef = useCallback((node) => {
    inputRef.current = node ?? null;
  }, []);

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
          onChange?.(event);
        },
        onFocus: (event) => {
          setIsOpen(true);
          onFocus?.(event);
        },
        onKeyDown: (event) => {
          if (!event.defaultPrevented) {
            onKeyDownPropRef.current?.(event);
          }
        },
      };
    },
    [handleInputRef, setInputValue, setIsFiltering, setIsOpen],
  );

  useKey(
    (event) => event.key === "ArrowDown" && event.target === inputRef.current,
    (event) => {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => {
        const options = optionsRef.current;
        const total = options.length;
        if (!total) return -1;
        if (prev < 0) return 0;
        const next = prev + 1;
        if (next >= total) {
          return allowCycleRef.current ? 0 : total - 1;
        }
        return next;
      });
    },
    undefined,
    [setIsOpen],
  );

  useKey(
    (event) => event.key === "ArrowUp" && event.target === inputRef.current,
    (event) => {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => {
        const options = optionsRef.current;
        const total = options.length;
        if (!total) return -1;
        if (prev < 0) return total - 1;
        const next = prev - 1;
        if (next < 0) {
          return allowCycleRef.current ? total - 1 : 0;
        }
        return next;
      });
    },
    undefined,
    [setIsOpen],
  );

  useKey(
    (event) => event.key === "Home" && event.target === inputRef.current,
    (event) => {
      event.preventDefault();
      setIsOpen(true);
      const options = optionsRef.current;
      setActiveIndex(options.length ? 0 : -1);
    },
    undefined,
    [setIsOpen],
  );

  useKey(
    (event) => event.key === "End" && event.target === inputRef.current,
    (event) => {
      event.preventDefault();
      setIsOpen(true);
      const options = optionsRef.current;
      setActiveIndex(options.length ? options.length - 1 : -1);
    },
    undefined,
    [setIsOpen],
  );

  useKey(
    (event) => event.key === "Enter" && event.target === inputRef.current,
    (event) => {
      const options = optionsRef.current;
      const total = options.length;
      if (!isOpen) {
        event.preventDefault();
        setIsOpen(true);
        syncActiveIndex(options, selectedKeyRef.current);
        return;
      }
      const index = activeIndex >= 0 ? activeIndex : total === 1 ? 0 : -1;
      if (index >= 0) {
        const option = options[index];
        if (option) {
          event.preventDefault();
          onCommitRef.current?.(option, index, event);
        }
      }
    },
    undefined,
    [activeIndex, isOpen, setIsOpen, syncActiveIndex],
  );

  useKey(
    (event) => event.key === "Escape" && event.target === inputRef.current,
    (event) => {
      event.preventDefault();
      if (isOpen) {
        closeList();
      } else {
        setInputValue(selectedTextRef.current);
        setIsFiltering(false);
      }
    },
    undefined,
    [closeList, isOpen, setInputValue, setIsFiltering],
  );

  const listProps = useMemo(
    () => ({
      id: listId,
      role: "listbox",
      ref: listRef,
    }),
    [listId],
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
