import { useMemo } from "react";
import { useKey } from "react-use";
import { clamp } from "@/utils/math";
import {
  FRETS_MAX,
  FRETS_MIN,
  STR_MAX,
  STR_MIN,
  DOT_SIZE_DEFAULT,
  DOT_SIZE_MAX,
  DOT_SIZE_MIN,
} from "@/lib/config/appDefaults";
import { isTypingTarget, matchesCombo } from "@/hooks/hotkeyUtils";

const createShortcutHandler = (shortcuts) => (event) => {
  if (isTypingTarget(event.target)) return;

  for (const shortcut of shortcuts) {
    if (!shortcut?.combo || typeof shortcut.handler !== "function") continue;
    if (typeof shortcut.when === "function" && !shortcut.when()) continue;

    const combos = Array.isArray(shortcut.combo)
      ? shortcut.combo
      : [shortcut.combo];
    if (combos.some((combo) => matchesCombo(combo, event))) {
      event.preventDefault();
      shortcut.handler(event);
      return;
    }
  }
};

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
    minStrings = STR_MIN,
    maxStrings = STR_MAX,
    minFrets = FRETS_MIN,
    maxFrets = FRETS_MAX,
    minDot = DOT_SIZE_MIN,
    maxDot = DOT_SIZE_MAX,
    onRandomizeScale,
    onCreateCustomPack,
    practiceActions,
  } = options;

  const labelValues = useMemo(
    () => options.labelValues || options.LABEL_VALUES || [],
    [options.labelValues, options.LABEL_VALUES],
  );

  const SHORTCUTS = useMemo(() => {
    const display = [
      {
        combo: ["shift+/", "ctrl+/", "F1"],
        handler: () => onShowCheatsheet?.(),
        when: () => typeof onShowCheatsheet === "function",
      },
      {
        combo: "f",
        handler: () => toggleFs?.(),
        when: () => typeof toggleFs === "function",
      },
      {
        combo: "l",
        handler: () => {
          setDisplayPrefs?.((d) => {
            if (!labelValues.length) return;
            const ix = labelValues.findIndex((v) => v === d.show);
            d.show = labelValues[(ix + 1) % labelValues.length];
          });
        },
        when: () => typeof setDisplayPrefs === "function",
      },
      {
        combo: "o",
        handler: () =>
          setDisplayPrefs?.((d) => {
            d.showOpen = !d.showOpen;
          }),
      },
      {
        combo: "n",
        handler: () =>
          setDisplayPrefs?.((d) => {
            d.showFretNums = !d.showFretNums;
          }),
      },
      {
        combo: "d",
        handler: () =>
          setDisplayPrefs?.((d) => {
            d.colorByDegree = !d.colorByDegree;
          }),
      },
      {
        combo: "a",
        handler: () =>
          setDisplayPrefs?.((d) => {
            d.accidental = d.accidental === "sharp" ? "flat" : "sharp";
          }),
      },
      {
        combo: "g",
        handler: () =>
          setDisplayPrefs?.((d) => {
            d.lefty = !d.lefty;
          }),
      },
      {
        combo: ",",
        handler: () =>
          setDisplayPrefs?.((d) => {
            d.dotSize = clamp(
              (d.dotSize ?? DOT_SIZE_DEFAULT) - 1,
              minDot,
              maxDot,
            );
          }),
      },
      {
        combo: ".",
        handler: () =>
          setDisplayPrefs?.((d) => {
            d.dotSize = clamp(
              (d.dotSize ?? DOT_SIZE_DEFAULT) + 1,
              minDot,
              maxDot,
            );
          }),
      },
    ];

    const instrument = [
      {
        combo: "c",
        handler: () => setShowChord?.(),
      },
      {
        combo: "h",
        handler: () => setHideNonChord?.(),
      },
      {
        combo: "[",
        handler: () =>
          handleStringsChange?.(
            clamp((strings ?? 0) - 1, minStrings, maxStrings),
          ),
      },
      {
        combo: "]",
        handler: () =>
          handleStringsChange?.(
            clamp((strings ?? 0) + 1, minStrings, maxStrings),
          ),
      },
      {
        combo: "-",
        handler: () => setFrets?.(clamp((frets ?? 0) - 1, minFrets, maxFrets)),
      },
      {
        combo: "=",
        handler: () => setFrets?.(clamp((frets ?? 0) + 1, minFrets, maxFrets)),
      },
    ];

    const practice = [
      {
        combo: "r",
        handler: () => {
          if (typeof practiceActions?.randomizeScaleNow === "function") {
            practiceActions.randomizeScaleNow();
            return;
          }
          onRandomizeScale?.();
        },
        when: () =>
          typeof practiceActions?.randomizeScaleNow === "function" ||
          typeof onRandomizeScale === "function",
      },
      {
        combo: ["m", "space"],
        handler: () => practiceActions?.toggleMetronome?.(),
        when: () => typeof practiceActions?.toggleMetronome === "function",
      },
      {
        combo: ["alt+[", "arrowdown"],
        handler: () => practiceActions?.bpmDown?.(),
        when: () => typeof practiceActions?.bpmDown === "function",
      },
      {
        combo: ["alt+]", "arrowup"],
        handler: () => practiceActions?.bpmUp?.(),
        when: () => typeof practiceActions?.bpmUp === "function",
      },
      {
        combo: ["t", "enter"],
        handler: () => practiceActions?.tapTempo?.(),
        when: () => typeof practiceActions?.tapTempo === "function",
      },
    ];

    const tuningPacks = [
      {
        combo: ["ctrl+n", "meta+n"],
        handler: () => onCreateCustomPack?.(),
        when: () => typeof onCreateCustomPack === "function",
      },
    ];

    return [...display, ...instrument, ...practice, ...tuningPacks];
  }, [
    frets,
    handleStringsChange,
    labelValues,
    maxDot,
    maxFrets,
    maxStrings,
    minDot,
    minFrets,
    minStrings,
    onCreateCustomPack,
    onRandomizeScale,
    onShowCheatsheet,
    practiceActions,
    setDisplayPrefs,
    setFrets,
    setHideNonChord,
    setShowChord,
    strings,
    toggleFs,
  ]);

  const onKey = useMemo(() => createShortcutHandler(SHORTCUTS), [SHORTCUTS]);
  useKey(true, onKey, undefined, [onKey]);
}
