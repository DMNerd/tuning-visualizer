import { useEffect, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { useImmer } from "use-immer";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DISPLAY_PREFS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(obj) {
  try {
    localStorage.setItem(STORAGE_KEYS.DISPLAY_PREFS, JSON.stringify(obj));
  } catch {
    // ignore quota/security errors
  }
}

export function useDisplayPrefs(initial) {
  const [prefs, setPrefs] = useImmer(() => ({ ...initial, ...readStore() }));
  const [debouncedPrefs] = useDebounce(prefs, 300);

  useEffect(() => {
    writeStore(debouncedPrefs);
  }, [debouncedPrefs]);

  return useMemo(() => [prefs, setPrefs], [prefs, setPrefs]);
}
