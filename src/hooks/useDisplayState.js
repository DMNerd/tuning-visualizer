import { useEffect, useMemo, useRef } from "react";
import { useFullscreen, useToggle } from "react-use";
import { usePersistedPrefs } from "@/hooks/usePersistedPrefs";
import { useTheme } from "@/hooks/useTheme";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";

export function useDisplayState(defaults) {
  const [displayPrefs, setDisplayPrefs, displaySetters] = usePersistedPrefs({
    storageKey: STORAGE_KEYS.DISPLAY_PREFS,
    initial: defaults,
    setterKeys: [
      "show",
      "showOpen",
      "showFretNums",
      "dotSize",
      "accidental",
      "microLabelStyle",
      "openOnlyInScale",
      "colorByDegree",
      "lefty",
    ],
    debounceMs: 300,
  });
  const [theme, setTheme, themeMode] = useTheme();

  const stageRef = useRef(null);
  const [isFsRequested, toggleFs] = useToggle(false);
  const isFs = useFullscreen(stageRef, isFsRequested, {
    onClose: () => toggleFs(false),
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isFs) root.classList.add("is-fs");
    else root.classList.remove("is-fs");
    return () => root.classList.remove("is-fs");
  }, [isFs]);

  const display = useMemo(
    () => ({
      prefs: displayPrefs,
      setPrefs: setDisplayPrefs,
      setters: displaySetters,
    }),
    [displayPrefs, setDisplayPrefs, displaySetters],
  );
  const themeState = useMemo(
    () => ({ value: theme, setTheme, mode: themeMode }),
    [theme, setTheme, themeMode],
  );
  const stage = useMemo(
    () => ({ stageRef, isFs, toggleFs }),
    [stageRef, isFs, toggleFs],
  );

  // Canonical API: consume `display`, `themeState`, and `stage`.
  return {
    display,
    themeState,
    stage,
  };
}

export function useDisplayPrefsSlice(displayState) {
  return displayState.display;
}

export function useDisplayStageSlice(displayState) {
  return displayState.stage;
}
