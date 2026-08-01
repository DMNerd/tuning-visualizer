import { STORAGE_KEYS } from "@shared/lib/storage/storageKeys";

import { useDisplayPrefsStore } from "@features/display/store/useDisplayPrefsStore";
import { useMetronomePrefsStore } from "@features/practice/store/useMetronomePrefsStore";
import { useMetronomeEngineStore } from "@features/practice/store/useMetronomeEngineStore";
import { useInstrumentCoreStore } from "@features/instrument/store/useInstrumentCoreStore";
import { useInstrumentWorkflowStore } from "@features/instrument/store/useInstrumentWorkflowStore";
import { useTheoryStore } from "@features/theory/store/useTheoryStore";
import { useThemeStore } from "@features/display/store/useThemeStore";
import { useTrainingRoutineStore } from "@features/training/store/useTrainingRoutineStore";

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
  useTrainingRoutineStore.getState().resetTrainingRoutines?.();

  clearPersistedStoreStorage(useDisplayPrefsStore);
  clearPersistedStoreStorage(useMetronomePrefsStore);
  clearPersistedStoreStorage(useInstrumentCoreStore);
  clearPersistedStoreStorage(useInstrumentWorkflowStore);
  clearPersistedStoreStorage(useTheoryStore);
  clearPersistedStoreStorage(useThemeStore);
  clearPersistedStoreStorage(useTrainingRoutineStore);

  clearAppOwnedStorageKeys();
}
