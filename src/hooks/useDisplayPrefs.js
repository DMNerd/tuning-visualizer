import { useState, useEffect } from "react";

const STORAGE_KEY = "tv.display-prefs";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
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
