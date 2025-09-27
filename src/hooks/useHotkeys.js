import { useEffect, useCallback } from "react";

const isTypingTarget = (el) => {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  const editable = el.getAttribute?.("contenteditable") === "true";
  return editable || tag === "input" || tag === "textarea" || tag === "select";
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const cycle = (arr, cur) =>
  arr[(arr.findIndex((v) => v === cur) + 1) % arr.length];

export function useHotkeys({
  toggleFs,
  setDisplayPrefs,
  setFrets,
  handleStringsChange,
  setShowChord,
  setHideNonChord,
  strings,
  frets,
  labelValues,
  onShowCheatsheet,
  minStrings = 4,
  maxStrings = 8,
  minFrets = 12,
  maxFrets = 30,
  minDot = 8,
  maxDot = 24,
}) {
  const onKeyDown = useCallback(
    (e) => {
      if (isTypingTarget(document.activeElement)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      switch (e.key) {
        case "?":
          e.preventDefault();
          onShowCheatsheet?.();
          break;
        case "f":
          e.preventDefault();
          toggleFs();
          break;
        case "l":
          e.preventDefault();
          setDisplayPrefs((p) => ({ ...p, show: cycle(labelValues, p.show) }));
          break;
        case "o":
          e.preventDefault();
          setDisplayPrefs((p) => ({ ...p, showOpen: !p.showOpen }));
          break;
        case "n":
          e.preventDefault();
          setDisplayPrefs((p) => ({ ...p, showFretNums: !p.showFretNums }));
          break;
        case "d":
          e.preventDefault();
          setDisplayPrefs((p) => ({ ...p, colorByDegree: !p.colorByDegree }));
          break;
        case "a":
          e.preventDefault();
          setDisplayPrefs((p) => ({
            ...p,
            accidental: p.accidental === "sharp" ? "flat" : "sharp",
          }));
          break;
        case "g":
          e.preventDefault();
          setDisplayPrefs((p) => ({ ...p, lefty: !p.lefty }));
          break;
        case "c":
          e.preventDefault();
          setShowChord((v) => !v);
          break;
        case "h":
          e.preventDefault();
          setHideNonChord((v) => !v);
          break;
        case "[": {
          e.preventDefault();
          handleStringsChange(clamp(strings - 1, minStrings, maxStrings));
          break;
        }
        case "]": {
          e.preventDefault();
          handleStringsChange(clamp(strings + 1, minStrings, maxStrings));
          break;
        }
        case "-": {
          e.preventDefault();
          setFrets(clamp(frets - 1, minFrets, maxFrets));
          break;
        }
        case "=": {
          e.preventDefault();
          setFrets(clamp(frets + 1, minFrets, maxFrets));
          break;
        }
        case ",": {
          e.preventDefault();
          setDisplayPrefs((p) => ({
            ...p,
            dotSize: clamp((p.dotSize ?? 14) - 1, minDot, maxDot),
          }));
          break;
        }
        case ".": {
          e.preventDefault();
          setDisplayPrefs((p) => ({
            ...p,
            dotSize: clamp((p.dotSize ?? 14) + 1, minDot, maxDot),
          }));
          break;
        }
        default:
          break;
      }
    },
    [
      toggleFs,
      setDisplayPrefs,
      setFrets,
      handleStringsChange,
      setShowChord,
      setHideNonChord,
      strings,
      frets,
      labelValues,
      onShowCheatsheet,
      minStrings,
      maxStrings,
      minFrets,
      maxFrets,
      minDot,
      maxDot,
    ],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);
}
