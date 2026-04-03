import { useCallback, useMemo } from "react";

import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { SYSTEM_DEFAULT, ROOT_DEFAULT } from "@/lib/config/appDefaults";
import { useValidatedStorage } from "@/hooks/useValidatedStorage";

export function useSystemPrefs({
  tunings,
  defaultSystemId = SYSTEM_DEFAULT,
  defaultRoot = ROOT_DEFAULT,
} = {}) {
  const coerceSystemId = useCallback(
    (value) => (value && tunings?.[value] ? value : defaultSystemId),
    [tunings, defaultSystemId],
  );

  const coerceRoot = useCallback(
    (value) => value ?? defaultRoot,
    [defaultRoot],
  );

  const [systemId, setSystemId] = useValidatedStorage({
    key: STORAGE_KEYS.SYSTEM_ID,
    defaultValue: defaultSystemId,
    coerce: coerceSystemId,
  });

  const [root, setRoot] = useValidatedStorage({
    key: STORAGE_KEYS.ROOT,
    defaultValue: defaultRoot,
    coerce: coerceRoot,
  });

  const ensureValidRoot = useCallback(
    (names) => {
      if (!Array.isArray(names) || !names.length) return;

      setRoot((prev) => {
        const current = prev ?? defaultRoot;
        if (names.includes(current)) return current;
        if (names.includes(defaultRoot)) return defaultRoot;
        return names[0];
      });
    },
    [setRoot, defaultRoot],
  );

  return useMemo(
    () => ({
      systemId,
      setSystemId,
      root,
      setRoot,
      ensureValidRoot,
    }),
    [systemId, setSystemId, root, setRoot, ensureValidRoot],
  );
}
