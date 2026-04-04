import { STORAGE_KEYS } from "@/lib/storage/storageKeys";

import { useDisplayPrefsStore } from "@/stores/useDisplayPrefsStore";
import { useMetronomePrefsStore } from "@/stores/useMetronomePrefsStore";
import { useInstrumentCoreStore } from "@/stores/useInstrumentCoreStore";
import { useInstrumentWorkflowStore } from "@/stores/useInstrumentWorkflowStore";
import { useTheoryStore } from "@/stores/useTheoryStore";
import { useThemeStore } from "@/stores/useThemeStore";

const APP_STORAGE_KEYS = [
  STORAGE_KEYS.THEORY_PREFS,
  STORAGE_KEYS.INSTRUMENT_CORE,
  STORAGE_KEYS.DISPLAY_PREFS,
  STORAGE_KEYS.METRONOME_PREFS,
  STORAGE_KEYS.THEME,
  STORAGE_KEYS.CUSTOM_TUNINGS,
  STORAGE_KEYS.STRINGS,
  STORAGE_KEYS.FRETS,
  STORAGE_KEYS.USER_DEFAULT_TUNING,
  STORAGE_KEYS.SYSTEM_ID,
  STORAGE_KEYS.ROOT,
];

function clearAppOwnedStorageKeys() {
  if (typeof globalThis.localStorage === "undefined") return;
  for (const key of APP_STORAGE_KEYS) {
    globalThis.localStorage.removeItem(key);
  }
}

export function resetAllStores() {
  useDisplayPrefsStore.getState().resetPrefs();
  useMetronomePrefsStore.getState().resetPrefs();
  useInstrumentCoreStore.getState().resetCore();
  useInstrumentWorkflowStore.getState().resetWorkflow();
  useTheoryStore.getState().resetTheory();
  useThemeStore.getState().resetTheme();

  clearAppOwnedStorageKeys();
}
