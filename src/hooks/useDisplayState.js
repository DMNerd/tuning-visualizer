import { useEffect, useRef } from "react";
import { useFullscreen, useToggle } from "react-use";
import { useDisplayPrefs } from "@/hooks/useDisplayPrefs";
import { useTheme } from "@/hooks/useTheme";

export function useDisplayState(defaults) {
  const [displayPrefs, setDisplayPrefs, displaySetters] =
    useDisplayPrefs(defaults);
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

  return {
    displayPrefs,
    setDisplayPrefs,
    displaySetters,
    theme,
    setTheme,
    themeMode,
    stageRef,
    isFs,
    toggleFs,
  };
}
