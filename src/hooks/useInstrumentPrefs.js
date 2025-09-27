import { useEffect, useState, useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const loadNum = (key, fallback, min, max) => {
  const raw = parseInt(localStorage.getItem(key), 10);
  return Number.isFinite(raw) ? clamp(raw, min, max) : fallback;
};

/**
 * Manages instrument-level persisted prefs (strings/frets).
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
  const [strings, setStrings] = useState(() =>
    loadNum(STORAGE_KEYS.STRINGS, STR_FACTORY, STR_MIN, STR_MAX),
  );

  // Persist strings whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STRINGS, String(strings));
  }, [strings]);

  // Load saved frets once on mount (clamped), without marking as "touched"
  useEffect(() => {
    const saved = parseInt(localStorage.getItem(STORAGE_KEYS.FRETS), 10);
    if (Number.isFinite(saved)) {
      setFretsUI(clamp(saved, FRETS_MIN, FRETS_MAX));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist frets only if user has touched the control
  useEffect(() => {
    if (fretsTouched) {
      localStorage.setItem(
        STORAGE_KEYS.FRETS,
        String(clamp(frets, FRETS_MIN, FRETS_MAX)),
      );
    }
  }, [frets, fretsTouched, FRETS_MIN, FRETS_MAX]);

  // Reset only the instrument prefs (strings/frets) and related storage
  const resetInstrumentPrefs = useCallback(
    (nextStringsFactory, nextFretsFactory) => {
      setStrings(nextStringsFactory);
      localStorage.setItem(STORAGE_KEYS.STRINGS, String(nextStringsFactory));

      setFrets(nextFretsFactory);
      localStorage.removeItem(STORAGE_KEYS.FRETS);
      setFretsTouched?.(false);
    },
    [setFrets, setFretsTouched],
  );

  return useMemo(
    () => ({ strings, setStrings, resetInstrumentPrefs }),
    [strings, resetInstrumentPrefs],
  );
}
