import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fullscreen hook for a specific element.
 * Usage:
 *   const { isActive, toggle, enter, exit } = useFullscreen(ref, { hotkey: true, docClass: 'is-fs' });
 */
export function useFullscreen(
  targetRef,
  { hotkey = true, docClass = "is-fs" } = {},
) {
  const [isActive, setIsActive] = useState(false);
  const lastRequestRef = useRef(null);

  const isFs = () =>
    !!document.fullscreenElement &&
    (targetRef?.current
      ? document.fullscreenElement === targetRef.current
      : true);

  const onChange = useCallback(() => {
    const active = isFs();
    setIsActive(active);
    const root = document.documentElement;
    if (active) root.classList.add(docClass);
    else root.classList.remove(docClass);
  }, [targetRef, docClass]);

  const enter = useCallback(async () => {
    if (!targetRef?.current) return;
    if (document.fullscreenElement) return; // already in FS
    try {
      lastRequestRef.current = targetRef.current;
      await targetRef.current.requestFullscreen({ navigationUI: "hide" });
    } catch {
      // ignore
    }
  }, [targetRef]);

  const exit = useCallback(async () => {
    if (!document.fullscreenElement) return;
    try {
      await document.exitFullscreen();
    } catch {
      // ignore
    }
  }, []);

  const toggle = useCallback(() => {
    if (isFs()) exit();
    else enter();
  }, [enter, exit]);

  useEffect(() => {
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [onChange]);

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e) => {
      // Ignore when typing in inputs/textareas
      const t = e.target;
      const isTyping =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);
      if (isTyping) return;

      // 'f' to toggle fullscreen
      if (
        (e.key === "f" || e.key === "F") &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey, toggle]);

  return { isActive, toggle, enter, exit };
}
