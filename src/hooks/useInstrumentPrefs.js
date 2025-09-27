import { useEffect, useMemo, useCallback } from "react";
import { useLocalStorage } from "react-use";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Manages instrument-level persisted prefs (strings/frets).
 * - strings: stored via useLocalStorage (immediate persistence)
 * - frets: loaded from storage; persisted only after user "touches"
 */
export function useInstrumentPrefs({
  frets,
  fretsTouched,
  setFrets,
  setFretsUI,
  setFretsTouched,
  STR_MIN,
  STR_MAX,
  FRETS_MIN,
  FRETS_MAX,
  STR_FACTORY,
}) {
  // Persisted strings (clamped)
  const [strings, setStrings] = useLocalStorage(
    STORAGE_KEYS.STRINGS,
    STR_FACTORY,
  );

  // Clamp strings if someone edited storage manually
  useEffect(() => {
    if (typeof strings === "number") {
      const fixed = clamp(strings, STR_MIN, STR_MAX);
      if (fixed !== strings) setStrings(fixed);
    }
  }, [strings, STR_MIN, STR_MAX, setStrings]);

  // Persisted frets value (WRITE only after user touches)
  const [savedFrets, setSavedFrets, removeSavedFrets] = useLocalStorage(
    STORAGE_KEYS.FRETS,
    undefined,
  );

  // Apply saved frets when present (clamped)
  useEffect(() => {
    const savedNum = Number(savedFrets);
    if (Number.isFinite(savedNum)) {
      setFretsUI(clamp(savedNum, FRETS_MIN, FRETS_MAX));
    }
  }, [savedFrets, setFretsUI, FRETS_MIN, FRETS_MAX]);

  // Persist frets only if user has touched the control
  useEffect(() => {
    if (fretsTouched) {
      setSavedFrets(clamp(frets, FRETS_MIN, FRETS_MAX)); // <-- keep name if your const is FREETS_MAX
    }
  }, [frets, fretsTouched, FRETS_MIN, FRETS_MAX, setSavedFrets]);

  // Reset only the instrument prefs (strings/frets) and related storage
  const resetInstrumentPrefs = useCallback(
    (nextStringsFactory, nextFretsFactory) => {
      setStrings(nextStringsFactory);
      setFrets(nextFretsFactory);
      removeSavedFrets(); // drop persisted frets
      setFretsTouched?.(false);
    },
    [setStrings, setFrets, removeSavedFrets, setFretsTouched],
  );

  return useMemo(
    () => ({ strings, setStrings, resetInstrumentPrefs }),
    [strings, setStrings, resetInstrumentPrefs],
  );
}
