import { clamp } from "@shared/lib/math";
import { DOT_SIZE_DEFAULT } from "@shared/config/appDefaults";

/** @typedef {import("@shared/hooks/hotkeys.types").HotkeysLiveRef} HotkeysLiveRef */

const ACCIDENTAL_CYCLE = ["sharp", "flat", "both"];

/** @param {HotkeysLiveRef} liveRef */
export function buildShortcutTableFromRefs(liveRef) {
  const getLive = () => liveRef.current || {};

  // Calls live[name] (or live.practiceActions[name]); active only when present.
  const callLive = (combo, name) => ({
    combo,
    handler: () => getLive()[name]?.(),
    when: () => typeof getLive()[name] === "function",
  });
  const callPractice = (combo, name) => ({
    combo,
    handler: () => getLive().practiceActions?.[name]?.(),
    when: () => typeof getLive().practiceActions?.[name] === "function",
  });

  const updateDisplay = (combo, update) => ({
    combo,
    handler: () => {
      const live = getLive();
      live.setDisplayPrefs?.((d) => update(d, live));
    },
  });
  const toggleDisplay = (combo, key) =>
    updateDisplay(combo, (d) => {
      d[key] = !d[key];
    });
  const cycleDisplay = (combo, key, getValues) =>
    updateDisplay(combo, (d, live) => {
      const values = getValues(live);
      if (!values.length) return;
      const ix = values.indexOf(d[key]);
      d[key] = values[(ix + 1) % values.length];
    });
  const stepDotSize = (combo, delta) =>
    updateDisplay(combo, (d, live) => {
      d.dotSize = clamp(
        (d.dotSize ?? DOT_SIZE_DEFAULT) + delta,
        live.minDot,
        live.maxDot,
      );
    });

  // Steps live[valueKey] by delta within [live[minKey], live[maxKey]].
  const stepLive = (combo, setterName, valueKey, minKey, maxKey, delta) => ({
    combo,
    handler: () => {
      const live = getLive();
      live[setterName]?.(
        clamp((live[valueKey] ?? 0) + delta, live[minKey], live[maxKey]),
      );
    },
  });

  const display = [
    callLive(["shift+/", "ctrl+/", "F1"], "onShowCheatsheet"),
    callLive("f", "toggleFs"),
    {
      ...cycleDisplay("l", "show", (live) => live.labelValues || []),
      when: () => typeof getLive().setDisplayPrefs === "function",
    },
    toggleDisplay("o", "showOpen"),
    toggleDisplay("n", "showFretNums"),
    toggleDisplay("d", "colorByDegree"),
    cycleDisplay("a", "accidental", () => ACCIDENTAL_CYCLE),
    toggleDisplay("g", "lefty"),
    stepDotSize(",", -1),
    stepDotSize(".", 1),
  ];

  const instrument = [
    { combo: "c", handler: () => getLive().setShowChord?.() },
    { combo: "h", handler: () => getLive().setHideNonChord?.() },
    stepLive(
      "[",
      "handleStringsChange",
      "strings",
      "minStrings",
      "maxStrings",
      -1,
    ),
    stepLive(
      "]",
      "handleStringsChange",
      "strings",
      "minStrings",
      "maxStrings",
      1,
    ),
    stepLive("-", "setFrets", "frets", "minFrets", "maxFrets", -1),
    stepLive("=", "setFrets", "frets", "minFrets", "maxFrets", 1),
  ];

  const practice = [
    {
      // Prefer the practice-panel randomizer; fall back to the app-level one.
      combo: "r",
      handler: () => {
        const live = getLive();
        if (
          typeof live.practiceActions?.randomizeScaleFromHotkey === "function"
        ) {
          live.practiceActions.randomizeScaleFromHotkey();
          return;
        }
        live.onRandomizeScale?.();
      },
      when: () => {
        const live = getLive();
        return (
          typeof live.practiceActions?.randomizeScaleFromHotkey ===
            "function" || typeof live.onRandomizeScale === "function"
        );
      },
    },
    callPractice(["m", "space"], "toggleMetronome"),
    callPractice(["alt+[", "arrowdown"], "bpmDown"),
    callPractice(["alt+]", "arrowup"], "bpmUp"),
    callPractice(["t", "enter"], "tapTempo"),
  ];

  const tuningPacks = [callLive(["ctrl+n", "meta+n"], "onCreateCustomPack")];

  return [...display, ...instrument, ...practice, ...tuningPacks];
}
