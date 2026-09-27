import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import {
  CHORD_DEFAULT,
  ROOT_DEFAULT,
  SCALE_DEFAULT,
  SYSTEM_DEFAULT,
} from "@shared/config/appDefaults";
import { STORAGE_KEYS } from "@shared/lib/storage/storageKeys";
import {
  createScopedStorage,
  getLocalStorage,
} from "@shared/lib/storage/scopedStorage";
import { makeImmerSetters } from "@shared/lib/makeImmerSetters";
import { createLegacyKeyCleanup } from "@shared/lib/storage/legacyKeyCleanup";

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasValidPersistedTheory(persistedState) {
  return !!(
    persistedState &&
    isNonEmptyString(persistedState.systemId) &&
    isNonEmptyString(persistedState.root)
  );
}

function readLegacyTheoryPrefs() {
  const storage = getLocalStorage();
  if (!storage) {
    return { systemId: SYSTEM_DEFAULT, root: ROOT_DEFAULT, found: false };
  }

  const legacySystemId = storage.getItem(STORAGE_KEYS.SYSTEM_ID);
  const legacyRoot = storage.getItem(STORAGE_KEYS.ROOT);
  const found = legacySystemId !== null || legacyRoot !== null;

  return {
    systemId: isNonEmptyString(legacySystemId)
      ? legacySystemId
      : SYSTEM_DEFAULT,
    root: isNonEmptyString(legacyRoot) ? legacyRoot : ROOT_DEFAULT,
    found,
  };
}

const legacyTheoryKeyCleanup = createLegacyKeyCleanup([
  STORAGE_KEYS.SYSTEM_ID,
  STORAGE_KEYS.ROOT,
]);

// Precedence: fully valid persisted payload, then legacy key, then this
// field's persisted value if it is itself valid, then the default. Blank or
// non-string persisted values are never used.
function resolveTheoryField(key, persisted, persistedValid, legacy, fallback) {
  return (
    (persistedValid ? persisted[key] : null) ||
    (legacy.found ? legacy[key] : null) ||
    (isNonEmptyString(persisted?.[key]) ? persisted[key] : null) ||
    fallback
  );
}

export const useTheoryStore = create(
  persist(
    immer((set) => {
      const setWithDraft = (updater) =>
        set((state) => {
          updater(state);
        });
      const baseSetters = makeImmerSetters(setWithDraft, [
        "systemId",
        "root",
        "scale",
        "chordRoot",
        "chordType",
      ]);
      // Explicit boolean sets the flag; anything else toggles it.
      const setOrToggle = (key) => (value) =>
        set((state) => {
          state[key] = typeof value === "boolean" ? value : !state[key];
        });
      const legacy = readLegacyTheoryPrefs();
      if (legacy.found) legacyTheoryKeyCleanup.mark();
      return {
        systemId: legacy.found ? legacy.systemId : SYSTEM_DEFAULT,
        root: legacy.found ? legacy.root : ROOT_DEFAULT,
        scale: SCALE_DEFAULT,
        isHydrated: false,
        chordRoot: ROOT_DEFAULT,
        chordType: CHORD_DEFAULT,
        showChord: false,
        hideNonChord: false,
        chordCapoRelative: false,
        chordIgnoresScale: false,
        ...baseSetters,
        setHydrated: (isHydrated = true) =>
          set((state) => {
            state.isHydrated = Boolean(isHydrated);
          }),
        setShowChord: setOrToggle("showChord"),
        setHideNonChord: setOrToggle("hideNonChord"),
        setChordCapoRelative: setOrToggle("chordCapoRelative"),
        setChordIgnoresScale: setOrToggle("chordIgnoresScale"),
        resetTheory: () =>
          set({
            systemId: SYSTEM_DEFAULT,
            root: ROOT_DEFAULT,
            scale: SCALE_DEFAULT,
            chordRoot: ROOT_DEFAULT,
            chordType: CHORD_DEFAULT,
            showChord: false,
            hideNonChord: false,
            chordCapoRelative: false,
            chordIgnoresScale: false,
          }),
      };
    }),
    {
      name: STORAGE_KEYS.THEORY_PREFS,
      version: 1,
      // Per-window-scoped, not global — matches useInstrumentCoreStore, so a
      // tuning system/root/scale change in one tab doesn't leak into others.
      storage: createJSONStorage(() => createScopedStorage()),
      migrate: (persistedState) => {
        if (hasValidPersistedTheory(persistedState)) {
          return persistedState;
        }

        const legacy = readLegacyTheoryPrefs();
        if (!legacy.found) {
          return persistedState;
        }

        legacyTheoryKeyCleanup.mark();

        return {
          ...(persistedState || {}),
          systemId: legacy.systemId,
          root: legacy.root,
        };
      },
      partialize: (state) => ({
        systemId: state.systemId,
        root: state.root,
        scale: state.scale,
      }),
      merge: (persisted, current) => {
        if (!persisted) {
          return current;
        }
        const legacy = readLegacyTheoryPrefs();
        if (legacy.found) legacyTheoryKeyCleanup.mark();
        const persistedValid = hasValidPersistedTheory(persisted);
        return {
          ...current,
          ...persisted,
          systemId: resolveTheoryField(
            "systemId",
            persisted,
            persistedValid,
            legacy,
            SYSTEM_DEFAULT,
          ),
          root: resolveTheoryField(
            "root",
            persisted,
            persistedValid,
            legacy,
            ROOT_DEFAULT,
          ),
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        _state?.setHydrated?.(true);
        if (error) return;
        legacyTheoryKeyCleanup.run();
      },
    },
  ),
);

export const selectTheoryState = (state) => ({
  systemId: state.systemId,
  root: state.root,
  scale: state.scale,
  chordRoot: state.chordRoot,
  chordType: state.chordType,
  showChord: state.showChord,
  hideNonChord: state.hideNonChord,
  chordCapoRelative: state.chordCapoRelative,
  chordIgnoresScale: state.chordIgnoresScale,
});

export const selectTheoryActions = (state) => ({
  setSystemId: state.setSystemId,
  setRoot: state.setRoot,
  setScale: state.setScale,
  setChordRoot: state.setChordRoot,
  setChordType: state.setChordType,
  setShowChord: state.setShowChord,
  setHideNonChord: state.setHideNonChord,
  setChordCapoRelative: state.setChordCapoRelative,
  setChordIgnoresScale: state.setChordIgnoresScale,
  resetTheory: state.resetTheory,
});

export const selectTheorySystemId = (state) => state.systemId;
export const selectTheoryRoot = (state) => state.root;
export const selectTheoryScale = (state) => state.scale;
export const selectTheoryChordRoot = (state) => state.chordRoot;
export const selectTheoryChordType = (state) => state.chordType;
export const selectTheoryShowChord = (state) => state.showChord;
export const selectTheoryHideNonChord = (state) => state.hideNonChord;
export const selectTheoryChordCapoRelative = (state) => state.chordCapoRelative;
export const selectTheoryChordIgnoresScale = (state) => state.chordIgnoresScale;
export const selectTheoryIsHydrated = (state) => state.isHydrated;
