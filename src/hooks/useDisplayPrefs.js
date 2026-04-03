import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { usePersistedPrefs } from "@/hooks/usePersistedPrefs";

export function useDisplayPrefs(initial) {
  return usePersistedPrefs({
    storageKey: STORAGE_KEYS.DISPLAY_PREFS,
    initial,
    setterKeys: [
      "show",
      "showOpen",
      "showFretNums",
      "dotSize",
      "accidental",
      "microLabelStyle",
      "openOnlyInScale",
      "colorByDegree",
      "lefty",
    ],
    debounceMs: 300,
  });
}
