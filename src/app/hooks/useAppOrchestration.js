import { createElement, useCallback } from "react";
import { toast } from "react-hot-toast";
import HotkeysCheatsheet from "@shared/ui/HotkeysCheatsheet";
import { LABEL_VALUES } from "@features/fretboard";
import { useAccidentalRespell } from "@features/theory";
import { useHotkeys } from "@shared/hooks/useHotkeys";
import { useResets } from "@shared/hooks/useResets";
import {
  CAPO_DEFAULT,
  FRETS_MAX,
  FRETS_MIN,
  STR_MAX,
  STR_MIN,
} from "@shared/config/appDefaults";

/** @typedef {import("@app/hooks/interfaces").AppOrchestrationInput} AppOrchestrationInput */

/** @param {AppOrchestrationInput} params */
export function useAppOrchestration({
  displayPrefs,
  setDisplayPrefs,
  resetDisplayPrefs,
  setTheme,
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
    noteNaming: displayPrefs.noteNaming,
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
    enabled: !customPackEditor.editorState && !customPackEditor.isManagerOpen,
  });

  const resets = useResets({
    system: theorySystem.system,
    resetInstrumentPrefs: instrumentActions.resetInstrumentPrefs,
    setCapoFret: instrumentCapo.setCapoFret,
    setStringMeta: instrumentActions.setStringMeta,
    setBoardMeta: instrumentActions.setBoardMeta,
    setDisplayPrefs,
    resetDisplayPrefs,
    setSystemId: theorySystem.setSystemId,
    setRoot: theorySystem.setRoot,
    setScale: theoryScale.setScale,
    setChordRoot: theoryChord.setChordRoot,
    setChordType: theoryChord.setChordType,
    setShowChord: theoryChord.setShowChord,
    setHideNonChord: theoryChord.setHideNonChord,
    setChordCapoRelative: theoryChord.setChordCapoRelative,
    resetTheory: theoryChord.resetTheory,
    setPreset: instrumentPresets.setPreset,
    setTheme,
    // Routine-aware: a raw engine stop here would leave an active training
    // routine's store/UI stuck if "Reset All" is used mid-routine.
    stopMetronome: practiceMetronome.stopMetronomeOrRoutine,
    resetMetronomePrefs: practiceReset.resetMetronomePrefs,
    resetPracticeCounters: practiceReset.resetPracticeCounters,
    toast,
    confirm,
  });

  const { setCapoFret } = instrumentCapo;
  const onResetCapo = useCallback(
    () => setCapoFret(CAPO_DEFAULT),
    [setCapoFret],
  );

  return {
    resets,
    showPracticeHud: practiceMetronome.engine.isPlaying,
    onResetCapo,
  };
}
