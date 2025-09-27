import { useEffect, useMemo } from "react";
import { useLocalStorage, useMedia } from "react-use";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";

export function useTheme(key = STORAGE_KEYS.THEME) {
  const [theme, setTheme] = useLocalStorage(key, "auto");
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
