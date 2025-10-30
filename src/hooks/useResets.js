import { useCallback } from "react";
import { useLatest } from "react-use";
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

export function useResets({
  system,
  resetInstrumentPrefs,
  setCapoFret,
  setStringMeta,
  setBoardMeta,
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
  const divisionsRef = useLatest(system.divisions);

  const resetInstrumentPrefsRef = useLatest(resetInstrumentPrefs);
  const setCapoFretRef = useLatest(setCapoFret);
  const setStringMetaRef = useLatest(setStringMeta);
  const setBoardMetaRef = useLatest(setBoardMeta);
  const setDisplayPrefsRef = useLatest(setDisplayPrefs);
  const setSystemIdRef = useLatest(setSystemId);
  const setRootRef = useLatest(setRoot);
  const setScaleRef = useLatest(setScale);
  const setChordRootRef = useLatest(setChordRoot);
  const setChordTypeRef = useLatest(setChordType);
  const setShowChordRef = useLatest(setShowChord);
  const setHideNonChordRef = useLatest(setHideNonChord);
  const setPresetRef = useLatest(setPreset);
  const toastRef = useLatest(toast);
  const confirmRef = useLatest(confirm);

  const resetInstrumentFactory = useCallback(
    (divisions) => {
      const edo = Number.isFinite(divisions) ? divisions : divisionsRef.current;
      const factoryFrets = getFactoryFrets(edo);
      resetInstrumentPrefsRef.current(STR_FACTORY, factoryFrets);
      setCapoFretRef.current(CAPO_DEFAULT);
      setStringMetaRef.current(null);
      setBoardMetaRef.current?.(null);
    },
    [
      divisionsRef,
      resetInstrumentPrefsRef,
      setCapoFretRef,
      setStringMetaRef,
      setBoardMetaRef,
    ],
  );

  const resetDisplay = useCallback(() => {
    setDisplayPrefsRef.current(DISPLAY_DEFAULTS);
  }, [setDisplayPrefsRef]);

  const resetSystem = useCallback(() => {
    setSystemIdRef.current?.(SYSTEM_DEFAULT);
  }, [setSystemIdRef]);

  const resetMusicalState = useCallback(() => {
    setRootRef.current(ROOT_DEFAULT);
    setScaleRef.current(SCALE_DEFAULT);
    setChordRootRef.current(ROOT_DEFAULT);
    setChordTypeRef.current(CHORD_DEFAULT);
    setShowChordRef.current(false);
    setHideNonChordRef.current(false);
    setPresetRef.current?.("Factory default");
  }, [
    setRootRef,
    setScaleRef,
    setChordRootRef,
    setChordTypeRef,
    setShowChordRef,
    setHideNonChordRef,
    setPresetRef,
  ]);

  const resetAll = useCallback(
    async ({ confirm: shouldConfirm = true } = {}) => {
      if (shouldConfirm && typeof confirmRef.current === "function") {
        const ok = await confirmRef.current({
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

      toastRef.current?.success?.("All settings reset.");
    },
    [
      resetSystem,
      resetInstrumentFactory,
      resetDisplay,
      resetMusicalState,
      confirmRef,
      toastRef,
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
