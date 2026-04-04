import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import {
  CHORD_DEFAULT,
  ROOT_DEFAULT,
  SCALE_DEFAULT,
  SYSTEM_DEFAULT,
} from "@/lib/config/appDefaults";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { makeImmerSetters } from "@/utils/makeImmerSetters";

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
  if (typeof globalThis.localStorage === "undefined") {
    return { systemId: SYSTEM_DEFAULT, root: ROOT_DEFAULT, found: false };
  }

  const legacySystemId = globalThis.localStorage.getItem(
    STORAGE_KEYS.SYSTEM_ID,
  );
  const legacyRoot = globalThis.localStorage.getItem(STORAGE_KEYS.ROOT);
  const found = legacySystemId !== null || legacyRoot !== null;

  return {
    systemId: isNonEmptyString(legacySystemId)
      ? legacySystemId
      : SYSTEM_DEFAULT,
    root: isNonEmptyString(legacyRoot) ? legacyRoot : ROOT_DEFAULT,
    found,
  };
}

const LEGACY_THEORY_KEYS = [STORAGE_KEYS.SYSTEM_ID, STORAGE_KEYS.ROOT];
let shouldCleanupLegacyTheoryKeys = false;

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
      const legacy = readLegacyTheoryPrefs();
      if (legacy.found) {
        shouldCleanupLegacyTheoryKeys = true;
      }
      return {
        systemId: legacy.found ? legacy.systemId : SYSTEM_DEFAULT,
        root: legacy.found ? legacy.root : ROOT_DEFAULT,
        scale: SCALE_DEFAULT,
        chordRoot: ROOT_DEFAULT,
        chordType: CHORD_DEFAULT,
        showChord: false,
        hideNonChord: false,
        ...baseSetters,
        setShowChord: (value) =>
          set((state) => {
            state.showChord =
              typeof value === "boolean" ? value : !state.showChord;
          }),
        setHideNonChord: (value) =>
          set((state) => {
            state.hideNonChord =
              typeof value === "boolean" ? value : !state.hideNonChord;
          }),
        resetTheory: () =>
          set({
            systemId: SYSTEM_DEFAULT,
            root: ROOT_DEFAULT,
            scale: SCALE_DEFAULT,
            chordRoot: ROOT_DEFAULT,
            chordType: CHORD_DEFAULT,
            showChord: false,
            hideNonChord: false,
          }),
      };
    }),
    {
      name: STORAGE_KEYS.THEORY_PREFS,
      version: 1,
      storage: createJSONStorage(() => globalThis.localStorage),
      migrate: (persistedState) => {
        if (hasValidPersistedTheory(persistedState)) {
          return persistedState;
        }

        const legacy = readLegacyTheoryPrefs();
        if (!legacy.found) {
          return persistedState;
        }

        shouldCleanupLegacyTheoryKeys = true;

        return {
          ...(persistedState || {}),
          systemId: legacy.systemId,
          root: legacy.root,
        };
      },
      partialize: (state) => ({
        systemId: state.systemId,
        root: state.root,
      }),
      merge: (persisted, current) => {
        if (!persisted) {
          return current;
        }
        const legacy = readLegacyTheoryPrefs();
        if (legacy.found) {
          shouldCleanupLegacyTheoryKeys = true;
        }
        const persistedValid = hasValidPersistedTheory(persisted);
        return {
          ...current,
          ...(persisted || {}),
          systemId:
            (persistedValid ? persisted.systemId : null) ||
            (legacy.found ? legacy.systemId : null) ||
            persisted?.systemId ||
            SYSTEM_DEFAULT,
          root:
            (persistedValid ? persisted.root : null) ||
            (legacy.found ? legacy.root : null) ||
            persisted?.root ||
            ROOT_DEFAULT,
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error || !shouldCleanupLegacyTheoryKeys) return;
        shouldCleanupLegacyTheoryKeys = false;
        if (typeof globalThis.localStorage === "undefined") return;
        for (const key of LEGACY_THEORY_KEYS) {
          globalThis.localStorage.removeItem(key);
        }
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
});

export const selectTheoryActions = (state) => ({
  setSystemId: state.setSystemId,
  setRoot: state.setRoot,
  setScale: state.setScale,
  setChordRoot: state.setChordRoot,
  setChordType: state.setChordType,
  setShowChord: state.setShowChord,
  setHideNonChord: state.setHideNonChord,
  resetTheory: state.resetTheory,
});

export const selectTheorySystemId = (state) => state.systemId;
export const selectTheoryRoot = (state) => state.root;
export const selectTheoryScale = (state) => state.scale;
export const selectTheoryChordRoot = (state) => state.chordRoot;
export const selectTheoryChordType = (state) => state.chordType;
export const selectTheoryShowChord = (state) => state.showChord;
export const selectTheoryHideNonChord = (state) => state.hideNonChord;
