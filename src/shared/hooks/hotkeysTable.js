import { clamp } from "@shared/lib/math";
import { DOT_SIZE_DEFAULT } from "@shared/config/appDefaults";

/** @typedef {import("@shared/hooks/hotkeys.types").HotkeysLiveRef} HotkeysLiveRef */

const ACCIDENTAL_CYCLE = ["sharp", "flat", "both"];

/** @param {HotkeysLiveRef} liveRef */
export function buildShortcutTableFromRefs(liveRef) {
  const getLive = () => liveRef.current || {};

  // Every shortcut is active only while the action it calls is wired up, so an
  // unwired key falls through to the browser instead of being swallowed.

  // `descKey` labels the shortcut in the cheatsheet; shortcuts sharing one
  // are shown as a "down / up" pair.

  // Calls live[name] (or live.practiceActions[name]).
  const callLive = (combo, name, descKey) => ({
    combo,
    descKey,
    handler: () => getLive()[name]?.(),
    when: () => typeof getLive()[name] === "function",
  });
  const callPractice = (combo, name, descKey) => ({
    combo,
    descKey,
    handler: () => getLive().practiceActions?.[name]?.(),
    when: () => typeof getLive().practiceActions?.[name] === "function",
  });

  const updateDisplay = (combo, descKey, update) => ({
    combo,
    descKey,
    handler: () => {
      const live = getLive();
      live.setDisplayPrefs?.((d) => update(d, live));
    },
    when: () => typeof getLive().setDisplayPrefs === "function",
  });
  const toggleDisplay = (combo, key, descKey) =>
    updateDisplay(combo, descKey, (d) => {
      d[key] = !d[key];
    });
  const cycleDisplay = (combo, key, getValues, descKey) =>
    updateDisplay(combo, descKey, (d, live) => {
      const values = getValues(live);
      if (!values.length) return;
      const ix = values.indexOf(d[key]);
      d[key] = values[(ix + 1) % values.length];
    });
  const stepDotSize = (combo, delta) =>
    updateDisplay(combo, "hotkeys.dotSize", (d, live) => {
      d.dotSize = clamp(
        (d.dotSize ?? DOT_SIZE_DEFAULT) + delta,
        live.minDot,
        live.maxDot,
      );
    });

  // Steps live[valueKey] by delta within [live[minKey], live[maxKey]].
  const stepLive = (
    combo,
    setterName,
    valueKey,
    minKey,
    maxKey,
    delta,
    descKey,
  ) => ({
    combo,
    descKey,
    handler: () => {
      const live = getLive();
      live[setterName]?.(
        clamp((live[valueKey] ?? 0) + delta, live[minKey], live[maxKey]),
      );
    },
    when: () => typeof getLive()[setterName] === "function",
  });

  const display = [
    callLive(["shift+/", "ctrl+/", "F1"], "onShowCheatsheet", "hotkeys.help"),
    callLive("f", "toggleFs", "hotkeys.fullscreen"),
    cycleDisplay(
      "l",
      "show",
      (live) => live.labelValues || [],
      "hotkeys.cycleLabels",
    ),
    toggleDisplay("o", "showOpen", "hotkeys.openNotes"),
    toggleDisplay("n", "showFretNums", "hotkeys.fretNumbers"),
    toggleDisplay("d", "colorByDegree", "hotkeys.colorByDegree"),
    cycleDisplay(
      "a",
      "accidental",
      () => ACCIDENTAL_CYCLE,
      "hotkeys.accidentals",
    ),
    toggleDisplay("g", "lefty", "hotkeys.lefty"),
    stepDotSize(",", -1),
    stepDotSize(".", 1),
  ];

  const instrument = [
    callLive("c", "setShowChord", "hotkeys.chordOverlay"),
    callLive("h", "setHideNonChord", "hotkeys.hideNonChord"),
    stepLive(
      "[",
      "handleStringsChange",
      "strings",
      "minStrings",
      "maxStrings",
      -1,
      "hotkeys.strings",
    ),
    stepLive(
      "]",
      "handleStringsChange",
      "strings",
      "minStrings",
      "maxStrings",
      1,
      "hotkeys.strings",
    ),
    stepLive(
      "-",
      "setFrets",
      "frets",
      "minFrets",
      "maxFrets",
      -1,
      "hotkeys.frets",
    ),
    stepLive(
      "=",
      "setFrets",
      "frets",
      "minFrets",
      "maxFrets",
      1,
      "hotkeys.frets",
    ),
  ];

  const practice = [
    {
      // Prefer the practice-panel randomizer; fall back to the app-level one.
      combo: "r",
      descKey: "hotkeys.randomize",
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
    callPractice(["m", "space"], "toggleMetronome", "hotkeys.metronome"),
    callPractice(["alt+[", "arrowdown"], "bpmDown", "hotkeys.bpm"),
    callPractice(["alt+]", "arrowup"], "bpmUp", "hotkeys.bpm"),
    callPractice(["t", "enter"], "tapTempo", "hotkeys.tapTempo"),
  ];

  const tuningPacks = [
    callLive(["ctrl+n", "meta+n"], "onCreateCustomPack", "hotkeys.newPack"),
  ];

  return [...display, ...instrument, ...practice, ...tuningPacks];
}

// Handled by the dropdown input itself rather than the global handler, so
// it's listed here only for the cheatsheet.
export const FAVORITE_OPTION_HOTKEY = {
  combo: ["ctrl+d", "meta+d"],
  descKey: "hotkeys.favorite",
};
