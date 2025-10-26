import { useCallback, useEffect, useMemo } from "react";
import { useLocalStorage } from "react-use";

import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { SYSTEM_DEFAULT, ROOT_DEFAULT } from "@/lib/config/appDefaults";

export function useSystemPrefs({
  tunings,
  defaultSystemId = SYSTEM_DEFAULT,
  defaultRoot = ROOT_DEFAULT,
} = {}) {
  const [storedSystemId, setStoredSystemId] = useLocalStorage(
    STORAGE_KEYS.SYSTEM_ID,
    defaultSystemId,
  );

  const systemId = useMemo(() => {
    if (storedSystemId && tunings?.[storedSystemId]) return storedSystemId;
    return defaultSystemId;
  }, [storedSystemId, tunings, defaultSystemId]);

  useEffect(() => {
    if (!storedSystemId || !tunings?.[storedSystemId]) {
      setStoredSystemId(defaultSystemId);
    }
  }, [storedSystemId, tunings, setStoredSystemId, defaultSystemId]);

  const setSystemId = useCallback(
    (next) => {
      if (typeof next === "function") {
        setStoredSystemId((prev) => {
          const resolved = next(prev ?? defaultSystemId);
          return tunings?.[resolved] ? resolved : defaultSystemId;
        });
        return;
      }

      if (next && tunings?.[next]) {
        setStoredSystemId(next);
      } else {
        setStoredSystemId(defaultSystemId);
      }
    },
    [setStoredSystemId, tunings, defaultSystemId],
  );

  const [storedRoot, setStoredRoot] = useLocalStorage(
    STORAGE_KEYS.ROOT,
    defaultRoot,
  );

  const root = storedRoot ?? defaultRoot;

  const setRoot = useCallback(
    (next) => {
      if (typeof next === "function") {
        setStoredRoot((prev) => {
          const resolved = next(prev ?? defaultRoot);
          return resolved ?? defaultRoot;
        });
        return;
      }

      setStoredRoot(next ?? defaultRoot);
    },
    [setStoredRoot, defaultRoot],
  );

  const ensureValidRoot = useCallback(
    (names) => {
      if (!Array.isArray(names) || !names.length) return;

      setStoredRoot((prev) => {
        const current = prev ?? defaultRoot;
        if (names.includes(current)) return current;
        if (names.includes(defaultRoot)) return defaultRoot;
        return names[0];
      });
    },
    [setStoredRoot, defaultRoot],
  );

  return useMemo(
    () => ({ systemId, setSystemId, root, setRoot, ensureValidRoot }),
    [systemId, setSystemId, root, setRoot, ensureValidRoot],
  );
}
