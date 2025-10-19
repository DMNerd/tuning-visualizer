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

      setTuning((draft) => {
        if (!Array.isArray(draft)) {
          return defaultForCount(nextCount);
        }

        const prevLen = draft.length;
        const prevFactory = defaultForCount(prevLen);
        const wasFactory = arraysEqual(draft, prevFactory);

        if (wasFactory) {
          return defaultForCount(nextCount);
        }

        if (nextCount <= prevLen) {
          draft.length = nextCount; 
          return;
        }

        const targetDefault = defaultForCount(nextCount);
        if (!Array.isArray(targetDefault)) {
          return;
        }

        for (let i = prevLen; i < nextCount; i++) {
          draft[i] = targetDefault[i];
        }
      });
    },
    [setStrings, setTuning, defaultForCount],
  );
}
