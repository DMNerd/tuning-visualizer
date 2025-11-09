import { useMemo } from "react";
import Fuse from "fuse.js";

function normalizeText(value) {
  if (typeof value !== "string") {
    if (value == null) return "";
    if (typeof value.toString === "function") {
      return normalizeText(value.toString());
    }
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function expandTerms(terms) {
  const normalized = new Set();
  terms.forEach((term) => {
    if (typeof term !== "string") return;
    const trimmed = term.trim();
    if (!trimmed) return;
    normalized.add(trimmed);
    normalized.add(
      trimmed
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, ""),
    );
  });
  return Array.from(normalized);
}

function defaultGetFilterTerms(option) {
  if (typeof option === "string") {
    return [option];
  }

  if (option && typeof option === "object") {
    const { label, name, value } = option;
    return [label, name, value].filter((term) => typeof term === "string");
  }

  return [];
}

function defaultNormalize(value) {
  return normalizeText(value);
}

export default function useFilteredOptions({
  options,
  inputValue,
  isFiltering,
  getQuery = defaultNormalize,
  getFilterTerms = defaultGetFilterTerms,
} = {}) {
  const normalizedQuery = useMemo(() => {
    if (!isFiltering) return "";
    return getQuery(inputValue ?? "");
  }, [getQuery, inputValue, isFiltering]);

  const indexedOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];

    return options.map((option) => {
      const terms = getFilterTerms(option);
      const list = Array.isArray(terms) ? terms : [terms];
      return {
        option,
        terms: expandTerms(list.filter((term) => typeof term === "string")),
      };
    });
  }, [options, getFilterTerms]);

  const fuse = useMemo(() => {
    if (!isFiltering) return null;
    if (!indexedOptions.length) return null;

    return new Fuse(indexedOptions, {
      keys: ["terms"],
      threshold: 0.35,
      ignoreLocation: true,
      isCaseSensitive: false,
      includeScore: false,
      shouldSort: true,
      minMatchCharLength: 1,
      distance: 100,
    });
  }, [indexedOptions, isFiltering]);

  const filteredOptions = useMemo(() => {
    if (!Array.isArray(options)) {
      return [];
    }

    if (!isFiltering) {
      return options;
    }

    if (!normalizedQuery) {
      return options;
    }

    if (!fuse) {
      return [];
    }

    return fuse.search(normalizedQuery).map((result) => result.item.option);
  }, [options, fuse, normalizedQuery, isFiltering]);

  return { filteredOptions, normalizedQuery };
}
