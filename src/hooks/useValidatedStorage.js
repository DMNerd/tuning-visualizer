import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce, useLocalStorage } from "react-use";
import { coerceWithFallback, resolveNextValue } from "@/hooks/validatedStorageUtils";

export function useValidatedStorage({
  key,
  defaultValue,
  coerce,
  debounceMs,
}) {
  const [stored, setStored, removeStored] = useLocalStorage(key, defaultValue);

  const validate = useCallback(
    (value) => coerceWithFallback(value, defaultValue, coerce),
    [defaultValue, coerce],
  );

  const [value, setValue] = useState(() => validate(stored));

  useEffect(() => {
    setValue(validate(stored));
  }, [stored, validate]);

  useEffect(() => {
    const validatedStored = validate(stored);
    if (!Object.is(stored, validatedStored)) {
      setStored(validatedStored);
    }
  }, [stored, setStored, validate]);

  const set = useCallback(
    (next) => {
      setValue((prev) => resolveNextValue(next, prev, defaultValue, coerce));
    },
    [defaultValue, coerce],
  );

  useEffect(() => {
    if (typeof debounceMs === "number" && debounceMs > 0) return;
    setStored(value);
  }, [value, setStored, debounceMs]);

  useDebounce(
    () => {
      if (typeof debounceMs === "number" && debounceMs > 0) {
        setStored(value);
      }
    },
    debounceMs ?? 0,
    [value, setStored, debounceMs],
  );

  const remove = useCallback(() => {
    removeStored();
    setValue(defaultValue);
  }, [removeStored, defaultValue]);

  return useMemo(() => [value, set, remove], [value, set, remove]);
}
