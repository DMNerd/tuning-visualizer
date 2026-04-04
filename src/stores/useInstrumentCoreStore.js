import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import {
  STR_FACTORY,
  FRETS_FACTORY,
  STR_MIN,
  STR_MAX,
  FRETS_MIN,
  FRETS_MAX,
} from "@/lib/config/appDefaults";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { clamp } from "@/utils/math";
import { applyValueOrUpdaterOnDraft } from "@/utils/applyValueOrUpdaterOnDraft";

function clampMaybeNumber(value, min, max, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clamp(value, min, max);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return clamp(parsed, min, max);
    }
  }

  return fallback;
}

function readLegacyNumber(key, min, max, fallback) {
  if (typeof globalThis.localStorage === "undefined")
    return { value: fallback, found: false };
  const raw = globalThis.localStorage.getItem(key);
  return {
    value: clampMaybeNumber(raw, min, max, fallback),
    found: raw !== null,
  };
}

function readLegacyDefaultTuningMap() {
  if (typeof globalThis.localStorage === "undefined")
    return { value: {}, found: false };
  try {
    const raw = globalThis.localStorage.getItem(
      STORAGE_KEYS.USER_DEFAULT_TUNING,
    );
    if (!raw) return { value: {}, found: false };
    const parsed = JSON.parse(raw);
    return {
      value:
        parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed
          : {},
      found: true,
    };
  } catch {
    return { value: {}, found: true };
  }
}

function isValidPersistedMap(value) {
  return !!(value && typeof value === "object" && !Array.isArray(value));
}

const LEGACY_CORE_KEYS = [
  STORAGE_KEYS.STRINGS,
  STORAGE_KEYS.FRETS,
  STORAGE_KEYS.USER_DEFAULT_TUNING,
];
let shouldCleanupLegacyInstrumentCoreKeys = false;

export const useInstrumentCoreStore = create(
  persist(
    immer((set) => {
      const legacyStrings = readLegacyNumber(
        STORAGE_KEYS.STRINGS,
        STR_MIN,
        STR_MAX,
        STR_FACTORY,
      );
      const legacyFrets = readLegacyNumber(
        STORAGE_KEYS.FRETS,
        FRETS_MIN,
        FRETS_MAX,
        FRETS_FACTORY,
      );
      const legacyDefaults = readLegacyDefaultTuningMap();
      if (legacyStrings.found || legacyFrets.found || legacyDefaults.found) {
        shouldCleanupLegacyInstrumentCoreKeys = true;
      }
      return {
        strings: legacyStrings.value,
        frets: legacyFrets.value,
        fretsTouched: false,
        tuning: [],
        stringMeta: null,
        boardMeta: null,
        userDefaultTuningMap: legacyDefaults.value,

        setStrings: (strings) => set({ strings }),
        setFrets: (frets) => set({ frets }),
        setFretsTouched: (fretsTouched) => set({ fretsTouched }),
        setFretsUI: (frets) => set({ frets, fretsTouched: true }),
        setTuning: (valueOrUpdater) =>
          set((state) => {
            if (
              typeof valueOrUpdater === "function" &&
              !Array.isArray(state.tuning)
            ) {
              state.tuning = [];
            }
            applyValueOrUpdaterOnDraft(state, "tuning", valueOrUpdater);
          }),
        setStringMeta: (stringMeta) => set({ stringMeta }),
        updateStringMeta: (draftUpdater) =>
          set((state) => {
            applyValueOrUpdaterOnDraft(state, "stringMeta", draftUpdater);
          }),
        setBoardMeta: (boardMeta) => set({ boardMeta }),
        updateBoardMeta: (draftUpdater) =>
          set((state) => {
            applyValueOrUpdaterOnDraft(state, "boardMeta", draftUpdater);
          }),
        setUserDefaultTuningMap: (valueOrUpdater) =>
          set((state) => {
            applyValueOrUpdaterOnDraft(
              state,
              "userDefaultTuningMap",
              valueOrUpdater,
            );
          }),
        updateUserDefaultTuningMap: (draftUpdater) =>
          set((state) => {
            applyValueOrUpdaterOnDraft(
              state,
              "userDefaultTuningMap",
              draftUpdater,
            );
          }),
        resetInstrumentPrefs: (nextStringsFactory, nextFretsFactory) =>
          set({
            strings: nextStringsFactory,
            frets: nextFretsFactory,
            fretsTouched: false,
          }),
        resetCore: () =>
          set({
            strings: STR_FACTORY,
            frets: FRETS_FACTORY,
            fretsTouched: false,
            tuning: [],
            stringMeta: null,
            boardMeta: null,
            userDefaultTuningMap: {},
          }),
      };
    }),
    {
      name: STORAGE_KEYS.INSTRUMENT_CORE,
      version: 1,
      storage: createJSONStorage(() => globalThis.localStorage),
      migrate: (persistedState) => {
        const hasPersisted =
          persistedState &&
          typeof persistedState === "object" &&
          !Array.isArray(persistedState);

        const legacyStrings = readLegacyNumber(
          STORAGE_KEYS.STRINGS,
          STR_MIN,
          STR_MAX,
          STR_FACTORY,
        );
        const legacyFrets = readLegacyNumber(
          STORAGE_KEYS.FRETS,
          FRETS_MIN,
          FRETS_MAX,
          FRETS_FACTORY,
        );
        const legacyDefaults = readLegacyDefaultTuningMap();
        const hasLegacyKeys =
          legacyStrings.found || legacyFrets.found || legacyDefaults.found;

        if (!hasPersisted) {
          if (hasLegacyKeys) {
            shouldCleanupLegacyInstrumentCoreKeys = true;
          }
          return {
            strings: legacyStrings.value,
            frets: legacyFrets.value,
            userDefaultTuningMap: legacyDefaults.value,
          };
        }

        return {
          ...persistedState,
          strings: clampMaybeNumber(
            persistedState.strings,
            STR_MIN,
            STR_MAX,
            legacyStrings.value,
          ),
          frets: clampMaybeNumber(
            persistedState.frets,
            FRETS_MIN,
            FRETS_MAX,
            legacyFrets.value,
          ),
          userDefaultTuningMap: isValidPersistedMap(
            persistedState.userDefaultTuningMap,
          )
            ? persistedState.userDefaultTuningMap
            : legacyDefaults.value,
        };
      },
      partialize: (state) => ({
        strings: state.strings,
        frets: state.frets,
        userDefaultTuningMap: state.userDefaultTuningMap,
      }),
      merge: (persisted, current) => {
        if (!persisted) {
          return current;
        }
        const legacyStrings = readLegacyNumber(
          STORAGE_KEYS.STRINGS,
          STR_MIN,
          STR_MAX,
          STR_FACTORY,
        );
        const legacyFrets = readLegacyNumber(
          STORAGE_KEYS.FRETS,
          FRETS_MIN,
          FRETS_MAX,
          FRETS_FACTORY,
        );
        const legacyDefaults = readLegacyDefaultTuningMap();
        const hasLegacyKeys =
          legacyStrings.found || legacyFrets.found || legacyDefaults.found;
        if (hasLegacyKeys) {
          shouldCleanupLegacyInstrumentCoreKeys = true;
        }

        return {
          ...current,
          ...(persisted || {}),
          strings: clampMaybeNumber(
            persisted?.strings,
            STR_MIN,
            STR_MAX,
            legacyStrings.found ? legacyStrings.value : STR_FACTORY,
          ),
          frets: clampMaybeNumber(
            persisted?.frets,
            FRETS_MIN,
            FRETS_MAX,
            legacyFrets.found ? legacyFrets.value : FRETS_FACTORY,
          ),
          userDefaultTuningMap: isValidPersistedMap(
            persisted?.userDefaultTuningMap,
          )
            ? persisted.userDefaultTuningMap
            : legacyDefaults.value,
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        if (error || !shouldCleanupLegacyInstrumentCoreKeys) return;
        shouldCleanupLegacyInstrumentCoreKeys = false;
        if (typeof globalThis.localStorage === "undefined") return;
        for (const key of LEGACY_CORE_KEYS) {
          globalThis.localStorage.removeItem(key);
        }
      },
    },
  ),
);

export const selectInstrumentCoreState = (state) => ({
  strings: state.strings,
  frets: state.frets,
  fretsTouched: state.fretsTouched,
  tuning: state.tuning,
  stringMeta: state.stringMeta,
  boardMeta: state.boardMeta,
  userDefaultTuningMap: state.userDefaultTuningMap,
});

export const selectInstrumentCoreActions = (state) => ({
  setStrings: state.setStrings,
  setFrets: state.setFrets,
  setFretsTouched: state.setFretsTouched,
  setFretsUI: state.setFretsUI,
  setTuning: state.setTuning,
  setStringMeta: state.setStringMeta,
  updateStringMeta: state.updateStringMeta,
  setBoardMeta: state.setBoardMeta,
  updateBoardMeta: state.updateBoardMeta,
  setUserDefaultTuningMap: state.setUserDefaultTuningMap,
  updateUserDefaultTuningMap: state.updateUserDefaultTuningMap,
  resetInstrumentPrefs: state.resetInstrumentPrefs,
  resetCore: state.resetCore,
});

export const selectInstrumentStrings = (state) => state.strings;
export const selectInstrumentFrets = (state) => state.frets;
export const selectInstrumentFretsTouched = (state) => state.fretsTouched;
export const selectInstrumentTuning = (state) => state.tuning;
export const selectInstrumentStringMeta = (state) => state.stringMeta;
export const selectInstrumentBoardMeta = (state) => state.boardMeta;
export const selectInstrumentDefaultTuningMap = (state) =>
  state.userDefaultTuningMap;
