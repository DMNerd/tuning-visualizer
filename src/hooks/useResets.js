import { useCallback } from "react";
import {
  STR_FACTORY,
  CAPO_DEFAULT,
  DISPLAY_DEFAULTS,
  ROOT_DEFAULT,
  SYSTEM_DEFAULT,
  getFactoryFrets,
} from "@/lib/config/appDefaults";

export function useResets({
  system,
  resetInstrumentPrefs,
  setCapoFret,
  setStringMeta,
  setDisplayPrefs,
  setSystemId,
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
  const resetInstrumentFactory = useCallback(
    (divisions) => {
      const edo = Number.isFinite(divisions) ? divisions : system.divisions;
      const factoryFrets = getFactoryFrets(edo);
      resetInstrumentPrefs(STR_FACTORY, factoryFrets);
      setCapoFret(CAPO_DEFAULT);
      setStringMeta(null);
    },
    [system.divisions, resetInstrumentPrefs, setCapoFret, setStringMeta],
  );

  const resetDisplay = useCallback(() => {
    setDisplayPrefs(DISPLAY_DEFAULTS);
  }, [setDisplayPrefs]);

  const resetSystem = useCallback(() => {
    setSystemId?.(SYSTEM_DEFAULT);
  }, [setSystemId]);

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
            "This will reset tuning system, instrument (strings, frets, capo), display, scale & root, and chord overlay.",
          confirmText: "Reset all",
          cancelText: "Cancel",
          toastId: "confirm-reset",
        });
        if (!ok) return;
      }

      const defaultEdo = Number.parseInt(SYSTEM_DEFAULT, 10);

      resetSystem();
      resetInstrumentFactory(
        Number.isFinite(defaultEdo) ? defaultEdo : undefined,
      );
      resetDisplay();
      resetMusicalState();

      toast?.success?.("All settings reset.");
    },
    [
      confirm,
      resetSystem,
      resetInstrumentFactory,
      resetDisplay,
      resetMusicalState,
      toast,
    ],
  );

  return {
    resetInstrumentFactory,
    resetDisplay,
    resetSystem,
    resetMusicalState,
    resetAll,
  };
}
