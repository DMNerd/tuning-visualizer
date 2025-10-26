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
    onRandomizeScale,
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

  // Cheatsheet
  useHK(
    ["shift+/", "ctrl+/", "F1"],
    () => {
      if (typeof onShowCheatsheet === "function") onShowCheatsheet();
    },
    guard,
    [onShowCheatsheet],
  );
  
  //TunningIO
  useHK(
  ["ctrl+n", "meta+n"],
  () => {
    if (typeof options.onCreateCustomPack === "function") {
      options.onCreateCustomPack();
    }
  },
  guard,
  [options.onCreateCustomPack],
);

  // Fullscreen
  useHK(
    "f",
    () => {
      if (typeof toggleFs === "function") toggleFs();
    },
    guard,
    [toggleFs],
  );

  // Labels cycle
  useHK(
    "l",
    () => {
      if (!setDisplayPrefs) return;
      setDisplayPrefs((d) => {
        if (!labelValues.length) return;
        const ix = labelValues.findIndex((v) => v === d.show);
        d.show = labelValues[(ix + 1) % labelValues.length];
      });
    },
    guard,
    [setDisplayPrefs, labelValues],
  );

  // Toggles
  useHK(
    "o",
    () =>
      setDisplayPrefs?.((d) => {
        d.showOpen = !d.showOpen;
      }),
    guard,
    [setDisplayPrefs],
  );
  useHK(
    "n",
    () =>
      setDisplayPrefs?.((d) => {
        d.showFretNums = !d.showFretNums;
      }),
    guard,
    [setDisplayPrefs],
  );
  useHK(
    "d",
    () =>
      setDisplayPrefs?.((d) => {
        d.colorByDegree = !d.colorByDegree;
      }),
    guard,
    [setDisplayPrefs],
  );
  useHK(
    "a",
    () =>
      setDisplayPrefs?.((d) => {
        d.accidental = d.accidental === "sharp" ? "flat" : "sharp";
      }),
    guard,
    [setDisplayPrefs],
  );
  useHK(
    "g",
    () =>
      setDisplayPrefs?.((d) => {
        d.lefty = !d.lefty;
      }),
    guard,
    [setDisplayPrefs],
  );

  // Chord overlay
  useHK("c", () => setShowChord?.(), guard, [setShowChord]);
  useHK("h", () => setHideNonChord?.(), guard, [setHideNonChord]);

  // Strings +/-
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

  // Frets +/-
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

  // Dot size +/-
  useHK(
    ",",
    () =>
      setDisplayPrefs?.((d) => {
        d.dotSize = clamp((d.dotSize ?? 14) - 1, minDot, maxDot);
      }),
    guard,
    [setDisplayPrefs, minDot, maxDot],
  );
  useHK(
    ".",
    () =>
      setDisplayPrefs?.((d) => {
        d.dotSize = clamp((d.dotSize ?? 14) + 1, minDot, maxDot);
      }),
    guard,
    [setDisplayPrefs, minDot, maxDot],
  );

  useHK(
    "r",
    () => {
      if (typeof options.onRandomizeScale === "function") {
        onRandomizeScale();
      }
    },
    guard,
    [onRandomizeScale],
  );
}
