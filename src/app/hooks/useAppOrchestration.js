import { createElement, useCallback } from "react";
import { toast } from "react-hot-toast";
import HotkeysCheatsheet from "@/components/UI/HotkeysCheatsheet";
import { LABEL_VALUES } from "@/hooks/useLabels";
import { useAccidentalRespell } from "@/hooks/useAccidentalRespell";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useResets } from "@/hooks/useResets";
import { CAPO_DEFAULT, FRETS_MAX, FRETS_MIN, STR_MAX, STR_MIN } from "@/lib/config/appDefaults";

/** @typedef {import("@/app/hooks/interfaces").AppOrchestrationInput} AppOrchestrationInput */

function validateOrchestrationInputsDev({
  displayPrefs,
  setDisplayPrefs,
  toggleFs,
  theorySystem,
  theoryChord,
  instrumentActions,
  practiceActions,
  practiceMetronome,
}) {
  if (!import.meta.env.DEV) return;

  const checks = [
    {
      path: "displayPrefs",
      valid:
        Boolean(displayPrefs) &&
        typeof displayPrefs === "object" &&
        !Array.isArray(displayPrefs),
    },
    { path: "setDisplayPrefs", valid: typeof setDisplayPrefs === "function" },
    { path: "toggleFs", valid: typeof toggleFs === "function" },
    { path: "theorySystem.setRoot", valid: typeof theorySystem?.setRoot === "function" },
    { path: "theoryChord.setChordRoot", valid: typeof theoryChord?.setChordRoot === "function" },
    { path: "instrumentActions.setTuning", valid: typeof instrumentActions?.setTuning === "function" },
    { path: "instrumentActions.setFretsUI", valid: typeof instrumentActions?.setFretsUI === "function" },
    {
      path: "practiceActions.randomizeScaleFromHotkey",
      valid: typeof practiceActions?.randomizeScaleFromHotkey === "function",
    },
    { path: "practiceMetronome.engine.stop", valid: typeof practiceMetronome?.engine?.stop === "function" },
  ];

  const missing = checks.filter((check) => !check.valid).map((check) => check.path);
  if (missing.length > 0) {
    throw new Error(
      `[useAppOrchestration] Missing or invalid required inputs: ${missing.join(", ")}`,
    );
  }
}

/** @param {AppOrchestrationInput} params */
export function useAppOrchestration({
  displayPrefs,
  setDisplayPrefs,
  toggleFs,
  theorySystem,
  theoryScale,
  theoryChord,
  instrumentActions,
  instrumentPresets,
  instrumentCapo,
  instrumentFrets,
  customPackEditor,
  practiceActions,
  practiceMetronome,
  practiceReset,
  confirm,
}) {
  validateOrchestrationInputsDev({
    displayPrefs,
    setDisplayPrefs,
    toggleFs,
    theorySystem,
    theoryChord,
    instrumentActions,
    practiceActions,
    practiceMetronome,
  });

  const showCheatsheet = useCallback(() => {
    toast(
      (t) =>
        createElement(HotkeysCheatsheet, {
          onClose: () => toast.dismiss(t.id),
        }),
      {
        id: "hotkeys-help",
        duration: 6000,
      },
    );
  }, []);

  useAccidentalRespell({
    system: theorySystem.system,
    accidental: displayPrefs.accidental,
    setRoot: theorySystem.setRoot,
    setTuning: instrumentActions.setTuning,
    setChordRoot: theoryChord.setChordRoot,
  });

  useHotkeys({
    toggleFs,
    setDisplayPrefs,
    setFrets: instrumentActions.setFretsUI,
    handleStringsChange: instrumentActions.handleStringsChange,
    setShowChord: theoryChord.setShowChord,
    setHideNonChord: theoryChord.setHideNonChord,
    onShowCheatsheet: showCheatsheet,
    onRandomizeScale: practiceActions.randomizeScaleFromHotkey,
    onCreateCustomPack: customPackEditor.openCreate,
    practiceActions,
    strings: instrumentFrets.strings,
    frets: instrumentFrets.frets,
    LABEL_VALUES,
    minStrings: STR_MIN,
    maxStrings: STR_MAX,
    minFrets: FRETS_MIN,
    maxFrets: FRETS_MAX,
  });

  const resets = useResets({
    system: theorySystem.system,
    resetInstrumentPrefs: instrumentActions.resetInstrumentPrefs,
    setCapoFret: instrumentCapo.setCapoFret,
    setStringMeta: instrumentActions.setStringMeta,
    setBoardMeta: instrumentActions.setBoardMeta,
    setDisplayPrefs,
    setSystemId: theorySystem.setSystemId,
    setRoot: theorySystem.setRoot,
    setScale: theoryScale.setScale,
    setChordRoot: theoryChord.setChordRoot,
    setChordType: theoryChord.setChordType,
    setShowChord: theoryChord.setShowChord,
    setHideNonChord: theoryChord.setHideNonChord,
    setPreset: instrumentPresets.setPreset,
    stopMetronome: practiceMetronome.engine.stop,
    resetMetronomePrefs: practiceReset.resetMetronomePrefs,
    resetPracticeCounters: practiceReset.resetPracticeCounters,
    toast,
    confirm,
  });

  return {
    resets,
    showPracticeHud: practiceMetronome.engine.isPlaying,
    onResetCapo: () => instrumentCapo.setCapoFret(CAPO_DEFAULT),
  };
}
