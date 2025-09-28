import { useEffect, useMemo, useCallback } from "react";
import { useLocalStorage } from "react-use";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { makeImmerSetters } from "@/utils/makeImmerSetters";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * Manages instrument-level persisted prefs (strings/frets).
 * - strings: persisted immediately via localStorage
 * - frets: hydrated from storage on mount (if present) but persisted only after user "touches"
 *   using the fretsTouched flag provided by the caller.
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
  const [strings, setStrings] = useLocalStorage(
    STORAGE_KEYS.STRINGS,
    STR_FACTORY,
  );

  useEffect(() => {
    if (typeof strings !== "number") {
      setStrings(STR_FACTORY);
      return;
    }
    const fixed = clamp(strings, STR_MIN, STR_MAX);
    if (fixed !== strings) setStrings(fixed);
  }, [strings, setStrings, STR_MIN, STR_MAX, STR_FACTORY]);

  const [savedFrets, setSavedFrets, removeSavedFrets] = useLocalStorage(
    STORAGE_KEYS.FRETS,
    undefined,
  );

  useEffect(() => {
    if (typeof savedFrets === "number" && !fretsTouched) {
      const fixed = clamp(savedFrets, FRETS_MIN, FRETS_MAX);
      setFretsUI(fixed);
    }
  }, [savedFrets, fretsTouched, setFretsUI, FRETS_MIN, FRETS_MAX]);

  useEffect(() => {
    if (fretsTouched && typeof frets === "number") {
      setSavedFrets(clamp(frets, FRETS_MIN, FRETS_MAX));
    }
  }, [frets, fretsTouched, FRETS_MIN, FRETS_MAX, setSavedFrets]);

  const resetInstrumentPrefs = useCallback(
    (nextStringsFactory, nextFretsFactory) => {
      setStrings(nextStringsFactory);
      setFrets(nextFretsFactory);
      removeSavedFrets();
      setFretsTouched?.(false);
    },
    [setStrings, setFrets, removeSavedFrets, setFretsTouched],
  );

  const setDraft = useCallback(
    (updater) => {
      const prev = { strings, frets, fretsTouched };
      const draft = { ...prev };
      updater(draft);
      if (draft.strings !== prev.strings) setStrings(draft.strings);
      if (draft.frets !== prev.frets) setFretsUI(draft.frets);
      if (draft.fretsTouched !== prev.fretsTouched)
        setFretsTouched?.(draft.fretsTouched);
    },
    [strings, frets, fretsTouched, setStrings, setFretsUI, setFretsTouched],
  );

  const fieldSetters = useMemo(
    () =>
      makeImmerSetters(setDraft, {
        strings: "setStringsPref",
        frets: "setFretsPref",
        fretsTouched: "setFretsTouchedPref",
      }),
    [setDraft],
  );

  return useMemo(
    () => ({
      strings,
      setStrings,
      resetInstrumentPrefs,
      ...fieldSetters,
    }),
    [strings, setStrings, resetInstrumentPrefs, fieldSetters],
  );
}
