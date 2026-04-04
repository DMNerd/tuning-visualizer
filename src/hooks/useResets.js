import { useCallback } from "react";
import {
  STR_FACTORY,
  CAPO_DEFAULT,
  DISPLAY_DEFAULTS,
  ROOT_DEFAULT,
  SYSTEM_DEFAULT,
  getFactoryFrets,
  SCALE_DEFAULT,
  CHORD_DEFAULT,
} from "@/lib/config/appDefaults";
import { useLatest } from "react-use";
import { resetAllStores } from "@/stores/resetAllStores";

export function useResets({
  system,
  resetInstrumentPrefs,
  setCapoFret,
  setStringMeta,
  setBoardMeta,
  setDisplayPrefs,
  resetDisplayPrefs,
  setSystemId,
  setRoot,
  setScale,
  setChordRoot,
  setChordType,
  setShowChord,
  setHideNonChord,
  resetTheory,
  setPreset,
  setTheme,
  stopMetronome,
  resetMetronomePrefs,
  resetPracticeCounters,
  toast,
  confirm,
}) {
  const refs = useLatest({
    divisions: system.divisions,
    resetInstrumentPrefs,
    setCapoFret,
    setStringMeta,
    setBoardMeta,
    setDisplayPrefs,
    resetDisplayPrefs,
    setSystemId,
    setRoot,
    setScale,
    setChordRoot,
    setChordType,
    setShowChord,
    setHideNonChord,
    resetTheory,
    setPreset,
    setTheme,
    stopMetronome,
    resetMetronomePrefs,
    resetPracticeCounters,
    toast,
    confirm,
  });

  const resetInstrumentState = useCallback(
    (divisions) => {
      const edo = Number.isFinite(divisions)
        ? divisions
        : refs.current.divisions;
      const factoryFrets = getFactoryFrets(edo);
      refs.current.resetInstrumentPrefs(STR_FACTORY, factoryFrets);
      refs.current.setCapoFret(CAPO_DEFAULT);
      refs.current.setStringMeta(null);
      refs.current.setBoardMeta?.(null);
    },
    [refs],
  );

  const resetDisplayState = useCallback(() => {
    if (typeof refs.current.resetDisplayPrefs === "function") {
      refs.current.resetDisplayPrefs();
      return;
    }
    refs.current.setDisplayPrefs?.(DISPLAY_DEFAULTS);
  }, [refs]);

  const resetSystem = useCallback(() => {
    refs.current.setSystemId?.(SYSTEM_DEFAULT);
  }, [refs]);

  const resetMusicalState = useCallback(() => {
    // Dependency note: stop/reset metronome before changing musical state
    // so no in-flight ticks can read stale root/scale/chord values.
    refs.current.stopMetronome?.();
    refs.current.resetMetronomePrefs?.();
    refs.current.resetPracticeCounters?.();

    if (typeof refs.current.resetTheory === "function") {
      refs.current.resetTheory();
    } else {
      refs.current.setRoot(ROOT_DEFAULT);
      refs.current.setScale(SCALE_DEFAULT);
      refs.current.setChordRoot(ROOT_DEFAULT);
      refs.current.setChordType(CHORD_DEFAULT);
      refs.current.setShowChord(false);
      refs.current.setHideNonChord(false);
    }
    refs.current.setPreset?.("Factory default");
    refs.current.setTheme?.("auto");
  }, [refs]);

  const resetInstrumentFactory = useCallback(
    (divisions) => {
      resetInstrumentState(divisions);
    },
    [resetInstrumentState],
  );

  const resetDisplay = useCallback(() => {
    resetDisplayState();
  }, [resetDisplayState]);

  const resetAll = useCallback(
    async ({ confirm: shouldConfirm = true } = {}) => {
      if (shouldConfirm && typeof refs.current.confirm === "function") {
        const ok = await refs.current.confirm({
          title: "Reset all settings?",
          message:
            "This will reset tuning system, instrument (strings, frets, capo), display, scale & root, chord overlay, and metronome.",
          confirmText: "Reset all",
          cancelText: "Cancel",
          toastId: "confirm-reset",
        });
        if (!ok) return;
      }

      refs.current.stopMetronome?.();
      refs.current.resetPracticeCounters?.();
      resetAllStores();

      refs.current.toast?.success?.("All settings reset.");
    },
    [refs],
  );

  return {
    resetInstrumentFactory,
    resetDisplay,
    resetSystem,
    resetMusicalState,
    resetAll,
  };
}
