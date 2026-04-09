import { STORAGE_KEYS } from "@/lib/storage/storageKeys";

import { useDisplayPrefsStore } from "@/stores/useDisplayPrefsStore";
import { useMetronomePrefsStore } from "@/stores/useMetronomePrefsStore";
import { useMetronomeEngineStore } from "@/stores/useMetronomeEngineStore";
import { useInstrumentCoreStore } from "@/stores/useInstrumentCoreStore";
import { useInstrumentWorkflowStore } from "@/stores/useInstrumentWorkflowStore";
import { useTheoryStore } from "@/stores/useTheoryStore";
import { useThemeStore } from "@/stores/useThemeStore";

const NON_PERSISTED_APP_KEYS = [
  // Global non-store key intentionally kept outside zustand persist.
  STORAGE_KEYS.USER_DEFAULT_TUNING,
  // Legacy keys kept for compatibility cleanup.
  STORAGE_KEYS.STRINGS,
  STORAGE_KEYS.FRETS,
  STORAGE_KEYS.SYSTEM_ID,
  STORAGE_KEYS.ROOT,
];

function clearAppOwnedStorageKeys() {
  // Persisted store keys are cleared via each store's persist.clearStorage(),
  // so this helper only cleans up non-persisted/legacy app keys.
  if (typeof globalThis.localStorage === "undefined") return;
  for (const key of NON_PERSISTED_APP_KEYS) {
    globalThis.localStorage.removeItem(key);
  }
}

function clearPersistedStoreStorage(store) {
  if (!store?.persist?.clearStorage) return;
  store.persist.clearStorage();
}

export function resetAllStores() {
  useDisplayPrefsStore.getState().resetPrefs?.();
  useMetronomePrefsStore.getState().resetPrefs?.();
  useMetronomeEngineStore.getState().resetPlaybackState?.();
  useInstrumentCoreStore.getState().resetCore?.();
  useInstrumentWorkflowStore.getState().resetWorkflow?.();
  useTheoryStore.getState().resetTheory?.();
  useThemeStore.getState().resetTheme?.();

  clearPersistedStoreStorage(useDisplayPrefsStore);
  clearPersistedStoreStorage(useMetronomePrefsStore);
  clearPersistedStoreStorage(useInstrumentCoreStore);
  clearPersistedStoreStorage(useInstrumentWorkflowStore);
  clearPersistedStoreStorage(useTheoryStore);
  clearPersistedStoreStorage(useThemeStore);

  clearAppOwnedStorageKeys();
}
