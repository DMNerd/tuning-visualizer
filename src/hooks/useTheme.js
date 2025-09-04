import { useEffect, useState } from "react";

/**
 * Theme hook with persistence and <html data-theme="{light|dark}"> sync.
 * Usage: const [theme, setTheme] = useTheme();
 */
export function useTheme(key = "fb.theme") {
  const getInitial = () => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === "dark" || saved === "light") return saved;
      if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch {
      // ignore storage errors
    }
    return "light";
  };

  const [theme, setTheme] = useState(getInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(key, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme, key]);

  return [theme, setTheme];
}
