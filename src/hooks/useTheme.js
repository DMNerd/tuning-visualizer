import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";

/**
 * Theme hook with persistence and <html data-theme="{light|dark}"> sync.
 * Modes: "light" | "dark" | "auto"
 */
export function useTheme(key = STORAGE_KEYS.THEME) {
  const media = useMemo(() => {
    try {
      return window.matchMedia?.("(prefers-color-scheme: dark)") || null;
    } catch {
      return null;
    }
  }, []);

  const getInitial = () => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === "dark" || saved === "light" || saved === "auto")
        return saved;
      return "auto";
    } catch {
      return "auto";
    }
  };

  const [theme, setTheme] = useState(getInitial);
  const [debouncedTheme] = useDebounce(theme, 300);

  const effectiveTheme = useMemo(() => {
    if (theme === "dark" || theme === "light") return theme;
    return media?.matches ? "dark" : "light";
  }, [theme, media]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(key, debouncedTheme);
    } catch {
      // ignore storage errors
    }
  }, [debouncedTheme, key]);

  useEffect(() => {
    if (!media || theme !== "auto") return;
    const handler = () => {
      const next = media.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
    };
    media.addEventListener?.("change", handler);
    return () => media.removeEventListener?.("change", handler);
  }, [theme, media]);

  return useMemo(
    () => [theme, setTheme, effectiveTheme],
    [theme, setTheme, effectiveTheme],
  );
}
