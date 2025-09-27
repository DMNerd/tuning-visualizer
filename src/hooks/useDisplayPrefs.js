import { useEffect, useMemo } from "react";
import { useLocalStorage } from "react-use";
import { useDebounce } from "use-debounce";
import { useImmer } from "use-immer";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";

export function useDisplayPrefs(initial) {
  const [stored, setStored] = useLocalStorage(
    STORAGE_KEYS.DISPLAY_PREFS,
    {},
  );

  const [prefs, setPrefs] = useImmer(() => ({
    ...initial,
    ...(stored || {}),
  }));

  useEffect(() => {
    setPrefs((d) => {
      Object.assign(d, initial, stored || {});
    });
  }, [stored, initial, setPrefs]);

  const [debouncedPrefs] = useDebounce(prefs, 300);
  useEffect(() => {
    setStored(debouncedPrefs);
  }, [debouncedPrefs, setStored]);

  return useMemo(() => [prefs, setPrefs], [prefs, setPrefs]);
}
