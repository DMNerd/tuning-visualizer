import { useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";

/**
 * Theme hook with persistence and <html data-theme="{light|dark}"> sync.
 * Modes: "light" | "dark" | "auto"
 * Usage:
 *   const [theme, setTheme, effectiveTheme] = useTheme(); // theme can be "auto"
 *   // effectiveTheme is "light" | "dark" (what's actually applied)
 */
export function useTheme(key = STORAGE_KEYS.THEME) {
  // Detect support once
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

  // Compute the actually-applied theme
  const effectiveTheme = useMemo(() => {
    if (theme === "dark" || theme === "light") return theme;
    // auto
    if (media?.matches) return "dark";
    return "light";
  }, [theme, media]);

  // Apply attribute + persist choice
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
    try {
      localStorage.setItem(key, theme);
    } catch {
      // ignore storage errors
    }
  }, [effectiveTheme, theme, key]);

  // If theme is "auto", subscribe to OS changes; unsubscribe otherwise
  useEffect(() => {
    if (!media) return;
    if (theme !== "auto") return;
    const handler = () => {
      const next = media.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
    };
    media.addEventListener?.("change", handler);
    return () => media.removeEventListener?.("change", handler);
  }, [theme, media]);

  return [theme, setTheme, effectiveTheme];
}
