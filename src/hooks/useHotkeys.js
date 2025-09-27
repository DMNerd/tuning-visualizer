import { useMemo } from "react";
import { useHotkeys as useHK } from "react-hotkeys-hook";

const isTypingTarget = (el) => {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  const editable = el.getAttribute?.("contenteditable") === "true";
  return editable || tag === "input" || tag === "textarea" || tag === "select";
};
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export function useHotkeys(options) {
  const {
    toggleFs,
    setDisplayPrefs,
    setFrets,
    handleStringsChange,
    setShowChord,
    setHideNonChord,
    strings,
    frets,
    onShowCheatsheet,
    minStrings = 4,
    maxStrings = 8,
    minFrets = 12,
    maxFrets = 30,
    minDot = 8,
    maxDot = 24,
  } = options;

  const labelValues = options.labelValues || options.LABEL_VALUES || [];

  const guard = useMemo(
    () => ({
      filter: (e) => !isTypingTarget(e?.target),
      preventDefault: true,
      enableOnFormTags: false,
    }),
    [],
  );


  useHK(
    ["shift+/", "shift++", "ctrl+/", "F1"],
    () => {
      if (typeof onShowCheatsheet === "function") onShowCheatsheet();
    },
    guard,
    [onShowCheatsheet],
  );


  // --- Fullscreen (migrated here) ---
  useHK(
    "f",
    () => {
      if (typeof toggleFs === "function") toggleFs();
    },
    guard,
    [toggleFs],
  );

  // --- Labels cycle ---
  useHK(
    "l",
    () => {
      if (!setDisplayPrefs) return;
      setDisplayPrefs((p) => ({
        ...p,
        show: labelValues.length
          ? labelValues[
              (labelValues.findIndex((v) => v === p.show) + 1) %
                labelValues.length
            ]
          : p.show,
      }));
    },
    guard,
    [setDisplayPrefs, labelValues],
  );

  // --- Toggles ---
  useHK(
    "o",
    () => setDisplayPrefs?.((p) => ({ ...p, showOpen: !p.showOpen })),
    guard,
    [setDisplayPrefs],
  );
  useHK(
    "n",
    () => setDisplayPrefs?.((p) => ({ ...p, showFretNums: !p.showFretNums })),
    guard,
    [setDisplayPrefs],
  );
  useHK(
    "d",
    () => setDisplayPrefs?.((p) => ({ ...p, colorByDegree: !p.colorByDegree })),
    guard,
    [setDisplayPrefs],
  );
  useHK(
    "a",
    () =>
      setDisplayPrefs?.((p) => ({
        ...p,
        accidental: p.accidental === "sharp" ? "flat" : "sharp",
      })),
    guard,
    [setDisplayPrefs],
  );
  useHK(
    "g",
    () => setDisplayPrefs?.((p) => ({ ...p, lefty: !p.lefty })),
    guard,
    [setDisplayPrefs],
  );

  // --- Chord overlay ---
  useHK("c", () => setShowChord?.((v) => !v), guard, [setShowChord]);
  useHK("h", () => setHideNonChord?.((v) => !v), guard, [setHideNonChord]);

  // --- Strings +/- ---
  useHK(
    "[",
    () =>
      handleStringsChange?.(clamp((strings ?? 0) - 1, minStrings, maxStrings)),
    guard,
    [handleStringsChange, strings, minStrings, maxStrings],
  );
  useHK(
    "]",
    () =>
      handleStringsChange?.(clamp((strings ?? 0) + 1, minStrings, maxStrings)),
    guard,
    [handleStringsChange, strings, minStrings, maxStrings],
  );

  // --- Frets +/- ---
  useHK(
    "-",
    () => setFrets?.(clamp((frets ?? 0) - 1, minFrets, maxFrets)),
    guard,
    [setFrets, frets, minFrets, maxFrets],
  );
  useHK(
    "=",
    () => setFrets?.(clamp((frets ?? 0) + 1, minFrets, maxFrets)),
    guard,
    [setFrets, frets, minFrets, maxFrets],
  );

  // --- Dot size +/- ---
  useHK(
    ",",
    () =>
      setDisplayPrefs?.((p) => ({
        ...p,
        dotSize: clamp((p.dotSize ?? 14) - 1, minDot, maxDot),
      })),
    guard,
    [setDisplayPrefs, minDot, maxDot],
  );
  useHK(
    ".",
    () =>
      setDisplayPrefs?.((p) => ({
        ...p,
        dotSize: clamp((p.dotSize ?? 14) + 1, minDot, maxDot),
      })),
    guard,
    [setDisplayPrefs, minDot, maxDot],
  );
}
