import { useMemo, useCallback } from "react";
import { useDebounce, useEffectOnce, useUpdateEffect } from "react-use";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { makeImmerSetters } from "@/utils/makeImmerSetters";
import { clamp } from "@/utils/math";
import { useValidatedStorage } from "@/hooks/useValidatedStorage";

const clampMaybeNumber = (value, min, max, fallback) => {
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
  const coerceStrings = useCallback(
    (value) => clampMaybeNumber(value, STR_MIN, STR_MAX, STR_FACTORY),
    [STR_MIN, STR_MAX, STR_FACTORY],
  );

  const coerceSavedFrets = useCallback(
    (value) => clampMaybeNumber(value, FRETS_MIN, FRETS_MAX, undefined),
    [FRETS_MIN, FRETS_MAX],
  );

  const [strings, setStrings] = useValidatedStorage({
    key: STORAGE_KEYS.STRINGS,
    defaultValue: STR_FACTORY,
    coerce: coerceStrings,
  });

  const [savedFrets, setSavedFrets, removeSavedFrets] = useValidatedStorage({
    key: STORAGE_KEYS.FRETS,
    defaultValue: undefined,
    coerce: coerceSavedFrets,
  });

  useEffectOnce(() => {
    if (typeof savedFrets === "number" && !fretsTouched) {
      const fixed = clamp(savedFrets, FRETS_MIN, FRETS_MAX);
      setFretsUI(fixed);
    }
  });

  useUpdateEffect(() => {
    if (typeof frets === "number" && fretsTouched) {
      const fixed = clamp(frets, FRETS_MIN, FRETS_MAX);
      if (fixed !== frets) setFretsUI(fixed);
    }
  }, [FRETS_MIN, FRETS_MAX]);

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
