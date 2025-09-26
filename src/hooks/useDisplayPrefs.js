import { useState, useEffect } from "react";
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
  const [prefs, setPrefs] = useState(() => ({ ...initial, ...readStore() }));

  useEffect(() => {
    writeStore(prefs);
  }, [prefs]);

  return [prefs, setPrefs];
}
