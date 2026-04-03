import { useEffect, useMemo } from "react";
import { useDebounce, useLocalStorage } from "react-use";
import { useImmer } from "use-immer";
import { makeImmerSetters } from "@/utils/makeImmerSetters";

export function usePersistedPrefs({
  storageKey,
  initial,
  setterKeys,
  debounceMs = 300,
}) {
  const [stored, setStored] = useLocalStorage(storageKey, {});

  const [prefs, setPrefs] = useImmer(() => ({
    ...initial,
    ...(stored || {}),
  }));

  useEffect(() => {
    setPrefs((draft) => {
      Object.assign(draft, initial, stored || {});
    });
  }, [stored, initial, setPrefs]);

  useDebounce(() => setStored(prefs), debounceMs, [prefs, setStored]);

  const fieldSetters = useMemo(
    () => makeImmerSetters(setPrefs, setterKeys),
    [setPrefs, setterKeys],
  );

  return useMemo(
    () => [prefs, setPrefs, fieldSetters],
    [prefs, setPrefs, fieldSetters],
  );
}
