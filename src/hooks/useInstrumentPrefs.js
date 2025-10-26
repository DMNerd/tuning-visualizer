import { useEffect, useMemo, useCallback } from "react";
import { useDebounce, useLocalStorage } from "react-use";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { makeImmerSetters } from "@/utils/makeImmerSetters";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const makeNumberStorageOptions = ({ min, max, fallback }) => {
  const coerce = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return clamp(value, min, max);
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return clamp(parsed, min, max);
      }
    }

    return fallback;
  };

  return {
    serializer: (value) => {
      const coerced = coerce(value);
      return JSON.stringify(coerced);
    },
    deserializer: (value) => {
      try {
        return coerce(JSON.parse(value));
      } catch {
        return fallback;
      }
    },
  };
};

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
  const stringStorageOptions = useMemo(
    () =>
      makeNumberStorageOptions({
        min: STR_MIN,
        max: STR_MAX,
        fallback: STR_FACTORY,
      }),
    [STR_MIN, STR_MAX, STR_FACTORY],
  );

  const fretsStorageOptions = useMemo(
    () =>
      makeNumberStorageOptions({
        min: FRETS_MIN,
        max: FRETS_MAX,
        fallback: undefined,
      }),
    [FRETS_MIN, FRETS_MAX],
  );

  const [strings, setStrings] = useLocalStorage(
    STORAGE_KEYS.STRINGS,
    STR_FACTORY,
    stringStorageOptions,
  );

  const [savedFrets, setSavedFrets, removeSavedFrets] = useLocalStorage(
    STORAGE_KEYS.FRETS,
    undefined,
    fretsStorageOptions,
  );

  // Hydrate frets from storage (one-time) if user hasn't touched frets yet.
  useEffect(() => {
    if (typeof savedFrets === "number" && !fretsTouched) {
      const fixed = clamp(savedFrets, FRETS_MIN, FRETS_MAX);
      setFretsUI(fixed);
    }
  }, [savedFrets, fretsTouched, setFretsUI, FRETS_MIN, FRETS_MAX]);

  // Debounced persistence once user has interacted with frets.
  useDebounce(
    () => {
      if (fretsTouched && typeof frets === "number" && Number.isFinite(frets)) {
        setSavedFrets(clamp(frets, FRETS_MIN, FRETS_MAX));
      }
    },
    300,
    [frets, fretsTouched, FRETS_MIN, FRETS_MAX, setSavedFrets],
  );

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

      if (draft.strings !== prev.strings) {
        setStrings(draft.strings);
      }

      if (draft.frets !== prev.frets) {
        // Update UI and mark as touched so debounced persistence will run.
        setFretsUI(draft.frets);
        setFretsTouched?.(true);
      }

      if (draft.fretsTouched !== prev.fretsTouched) {
        setFretsTouched?.(draft.fretsTouched);
      }
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
