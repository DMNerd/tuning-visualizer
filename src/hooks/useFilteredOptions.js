import { useMemo, useRef } from "react";
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

function defaultGetOptionIdentity(option, index) {
  if (option && typeof option === "object") {
    return option;
  }

  return `${typeof option}:${String(option ?? "")}:${index}`;
}

export default function useFilteredOptions({
  options,
  inputValue,
  isFiltering,
  getQuery = defaultNormalize,
  getFilterTerms = defaultGetFilterTerms,
  getOptionIdentity = defaultGetOptionIdentity,
  optionsVersion,
} = {}) {
  const normalizedQuery = useMemo(() => {
    if (!isFiltering) return "";
    return getQuery(inputValue ?? "");
  }, [getQuery, inputValue, isFiltering]);

  const termCacheRef = useRef({
    weak: new WeakMap(),
    strong: new Map(),
  });

  const indexedOptions = useMemo(() => {
    if (!Array.isArray(options)) return [];
    void optionsVersion;

    const weakCache = termCacheRef.current.weak;
    const strongCache = termCacheRef.current.strong;

    return options.map((option, index) => {
      const identity = getOptionIdentity(option, index);
      const isObjectIdentity = identity && typeof identity === "object";
      const cache = isObjectIdentity ? weakCache : strongCache;
      const cached = cache.get(identity);

      if (cached?.source === option) {
        return {
          option,
          terms: cached.terms,
        };
      }

      const terms = getFilterTerms(option);
      const list = Array.isArray(terms) ? terms : [terms];
      const expandedTerms = expandTerms(
        list.filter((term) => typeof term === "string"),
      );

      cache.set(identity, {
        source: option,
        terms: expandedTerms,
      });

      return {
        option,
        terms: expandedTerms,
      };
    });
  }, [options, getFilterTerms, getOptionIdentity, optionsVersion]);

  const fuse = useMemo(() => {
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
  }, [indexedOptions]);

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
