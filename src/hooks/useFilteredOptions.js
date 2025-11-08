import { useMemo } from "react";

function defaultNormalize(value) {
  if (typeof value !== "string") {
    if (value == null) return "";
    if (typeof value.toString === "function") {
      return value.toString().toLowerCase();
    }
    return "";
  }
  return value.trim().toLowerCase();
}

function defaultFilter(options, query) {
  if (!query) {
    return Array.isArray(options) ? options : [];
  }
  const list = Array.isArray(options) ? options : [];
  return list.filter((option) => {
    if (typeof option === "string") {
      return option.toLowerCase().includes(query);
    }
    if (option && typeof option === "object") {
      if (typeof option.label === "string") {
        return option.label.toLowerCase().includes(query);
      }
      if (typeof option.name === "string") {
        return option.name.toLowerCase().includes(query);
      }
    }
    return false;
  });
}

export default function useFilteredOptions({
  options,
  inputValue,
  isFiltering,
  getQuery = defaultNormalize,
  filter = defaultFilter,
} = {}) {
  const normalizedQuery = useMemo(() => {
    if (!isFiltering) return "";
    return getQuery(inputValue ?? "");
  }, [getQuery, inputValue, isFiltering]);

  const filteredOptions = useMemo(() => {
    return filter(options, normalizedQuery);
  }, [options, normalizedQuery, filter]);

  return { filteredOptions, normalizedQuery };
}