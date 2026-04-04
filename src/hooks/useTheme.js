import { useEffect, useMemo } from "react";
import { useMedia } from "react-use";
import { useShallow } from "zustand/react/shallow";

import {
  useThemeStore,
  selectTheme,
  selectSetTheme,
} from "@/stores/useThemeStore";

export function useTheme() {
  const { theme, setTheme } = useThemeStore(
    useShallow((state) => ({
      theme: selectTheme(state),
      setTheme: selectSetTheme(state),
    })),
  );
  const prefersDark = useMedia("(prefers-color-scheme: dark)", false);

  const effectiveTheme = useMemo(() => {
    if (theme === "dark" || theme === "light") return theme;
    return prefersDark ? "dark" : "light";
  }, [theme, prefersDark]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
  }, [effectiveTheme]);

  return useMemo(
    () => [theme, setTheme, effectiveTheme],
    [theme, setTheme, effectiveTheme],
  );
}
