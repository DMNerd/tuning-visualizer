import { useCallback } from "react";
import {
  STR_FACTORY,
  CAPO_DEFAULT,
  DISPLAY_DEFAULTS,
  ROOT_DEFAULT,
  getFactoryFrets,
} from "@/lib/config/appDefaults";

export function useResets({
  system,
  resetInstrumentPrefs,
  setCapoFret,
  setStringMeta,
  setDisplayPrefs,
  setRoot,
  setScale,
  setChordRoot,
  setChordType,
  setShowChord,
  setHideNonChord,
  setPreset,
  toast,
  confirm,
}) {
  const resetInstrumentFactory = useCallback(() => {
    const factoryFrets = getFactoryFrets(system.divisions);
    resetInstrumentPrefs(STR_FACTORY, factoryFrets);
    setCapoFret(CAPO_DEFAULT);
    setStringMeta(null);
  }, [system.divisions, resetInstrumentPrefs, setCapoFret, setStringMeta]);

  const resetDisplay = useCallback(() => {
    setDisplayPrefs(DISPLAY_DEFAULTS);
  }, [setDisplayPrefs]);

  const resetMusicalState = useCallback(() => {
    setRoot(ROOT_DEFAULT);
    setScale("Major (Ionian)");
    setChordRoot(ROOT_DEFAULT);
    setChordType("maj");
    setShowChord(false);
    setHideNonChord(false);
    setPreset?.("Factory default");
  }, [
    setRoot,
    setScale,
    setChordRoot,
    setChordType,
    setShowChord,
    setHideNonChord,
    setPreset,
  ]);

  const resetAll = useCallback(
    async ({ confirm: shouldConfirm = true } = {}) => {
      if (shouldConfirm && typeof confirm === "function") {
        const ok = await confirm({
          title: "Reset all settings?",
          message:
            "This will reset instrument (strings, frets, capo), display, scale & root, and chord overlay.",
          confirmText: "Reset all",
          cancelText: "Cancel",
          toastId: "confirm-reset",
        });
        if (!ok) return;
      }

      resetInstrumentFactory();
      resetDisplay();
      resetMusicalState();

      toast?.success?.("All settings reset.");
    },
    [confirm, resetInstrumentFactory, resetDisplay, resetMusicalState, toast],
  );

  return {
    resetInstrumentFactory,
    resetDisplay,
    resetMusicalState,
    resetAll,
  };
}
