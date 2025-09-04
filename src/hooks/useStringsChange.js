import { useCallback } from "react";

export function useStringsChange({ setStrings, setTuning, defaultForCount }) {
  const arraysEqual = (a, b) =>
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((v, i) => v === b[i]);

  return useCallback(
    (nextCount) => {
      setStrings(nextCount);
      setTuning((prev) => {
        if (!Array.isArray(prev)) return defaultForCount(nextCount);

        const prevFactory = defaultForCount(prev.length);
        const wasFactory = arraysEqual(prev, prevFactory);

        if (wasFactory) return defaultForCount(nextCount);

        if (nextCount <= prev.length) return prev.slice(0, nextCount);
        const targetDefault = defaultForCount(nextCount);
        return [...prev, ...targetDefault.slice(prev.length)];
      });
    },
    [setStrings, setTuning, defaultForCount],
  );
}
