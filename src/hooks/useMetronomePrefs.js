import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { usePersistedPrefs } from "@/hooks/usePersistedPrefs";

export function useMetronomePrefs(initial) {
  return usePersistedPrefs({
    storageKey: STORAGE_KEYS.METRONOME_PREFS,
    initial,
    setterKeys: [
      "bpm",
      "timeSig",
      "subdivision",
      "countInEnabled",
      "autoAdvanceEnabled",
      "barsPerScale",
      "announceCountInBeforeChange",
    ],
    debounceMs: 300,
  });
}
