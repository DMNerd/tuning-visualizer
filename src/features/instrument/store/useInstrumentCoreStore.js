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
} from "@shared/config/appDefaults";
import { STORAGE_KEYS } from "@shared/lib/storage/storageKeys";
import { createScopedStorage } from "@shared/lib/storage/scopedStorage";
import { clamp, clampNumeric } from "@shared/lib/math";
import { applyValueOrUpdaterOnDraft } from "@shared/lib/applyValueOrUpdaterOnDraft";
import {
  coerceNeckFilterMode,
  NECK_FILTER_MODES,
} from "@domain/presets/neckFilterModes";
import {
  cleanupLegacyInstrumentCoreKeys,
  markLegacyInstrumentCoreKeysForCleanup,
  primeGlobalDefaultTuningCache,
  readLegacyInstrumentCore,
  syncGlobalDefaultTunings,
} from "@features/instrument/store/instrumentCoreLegacyStorage";

function resolvePersistedNeckFilterMode(persistedState) {
  return coerceNeckFilterMode(
    persistedState?.neckFilterMode ?? NECK_FILTER_MODES.NONE,
  );
}

function applyTuningDraft(state, valueOrUpdater, { atomic = false } = {}) {
  if (typeof valueOrUpdater === "function" && !Array.isArray(state.tuning)) {
    state.tuning = [];
  }
  applyValueOrUpdaterOnDraft(state, "tuning", valueOrUpdater);
  if (atomic) state.tuningAtomicEpoch += 1;
}

export const useInstrumentCoreStore = create(
  persist(
    immer((set) => {
      const updateUserDefaultTuningMap = (valueOrUpdater) =>
        set((state) => {
          applyValueOrUpdaterOnDraft(
            state,
            "userDefaultTuningMap",
            valueOrUpdater,
          );
          syncGlobalDefaultTunings(state.userDefaultTuningMap);
        });
      const {
        strings: legacyStrings,
        frets: legacyFrets,
        defaults: legacyDefaults,
        hasLegacyKeys,
      } = readLegacyInstrumentCore();
      primeGlobalDefaultTuningCache(legacyDefaults.value);
      if (hasLegacyKeys) markLegacyInstrumentCoreKeysForCleanup();
      return {
        strings: legacyStrings.value,
        frets: legacyFrets.value,
        isHydrated: false,
        fretsTouched: false,
        tuning: [],
        // Bumped whenever setTuningAtomic runs a tuning change together with
        // a systemId/strings change (see applyResolvedTuning.ts). Downstream
        // effects that would otherwise reset tuning back to a default on
        // systemId/strings changes watch this epoch (not tuning reference
        // equality, which callers like useStringsChange also produce) to
        // tell "atomic preset apply" apart from any other tuning update.
        tuningAtomicEpoch: 0,
        stringMeta: null,
        boardMeta: null,
        neckFilterMode: NECK_FILTER_MODES.NONE,
        userDefaultTuningMap: legacyDefaults.value,

        setStrings: (strings) =>
          set({ strings: clamp(strings, STR_MIN, STR_MAX) }),
        setHydrated: (isHydrated = true) =>
          set({ isHydrated: Boolean(isHydrated) }),
        setFrets: (frets) => set({ frets: clamp(frets, FRETS_MIN, FRETS_MAX) }),
        setFretsTouched: (fretsTouched) => set({ fretsTouched }),
        setFretsUI: (frets) =>
          set({
            frets: clamp(frets, FRETS_MIN, FRETS_MAX),
            fretsTouched: true,
          }),
        setTuning: (valueOrUpdater) =>
          set((state) => applyTuningDraft(state, valueOrUpdater)),
        setTuningAtomic: (valueOrUpdater) =>
          set((state) =>
            applyTuningDraft(state, valueOrUpdater, { atomic: true }),
          ),
        setStringMeta: (stringMeta) => set({ stringMeta }),
        updateStringMeta: (draftUpdater) =>
          set((state) => {
            applyValueOrUpdaterOnDraft(state, "stringMeta", draftUpdater);
          }),
        setBoardMeta: (boardMeta) => set({ boardMeta }),
        setNeckFilterMode: (neckFilterMode) =>
          set({ neckFilterMode: coerceNeckFilterMode(neckFilterMode) }),
        updateBoardMeta: (draftUpdater) =>
          set((state) => {
            applyValueOrUpdaterOnDraft(state, "boardMeta", draftUpdater);
          }),
        setUserDefaultTuningMap: updateUserDefaultTuningMap,
        updateUserDefaultTuningMap,
        resetInstrumentPrefs: (nextStringsFactory, nextFretsFactory) =>
          set({
            strings: nextStringsFactory,
            frets: nextFretsFactory,
            fretsTouched: false,
          }),
        resetCore: () =>
          set((state) => {
            state.strings = STR_FACTORY;
            state.frets = FRETS_FACTORY;
            state.fretsTouched = false;
            state.tuning = [];
            state.tuningAtomicEpoch = 0;
            state.stringMeta = null;
            state.boardMeta = null;
            state.neckFilterMode = NECK_FILTER_MODES.NONE;
            state.userDefaultTuningMap = {};
            syncGlobalDefaultTunings(state.userDefaultTuningMap);
          }),
      };
    }),
    {
      name: STORAGE_KEYS.INSTRUMENT_CORE,
      version: 3,
      storage: createJSONStorage(() => createScopedStorage()),
      migrate: (persistedState) => {
        const hasPersisted =
          persistedState &&
          typeof persistedState === "object" &&
          !Array.isArray(persistedState);

        const {
          strings: legacyStrings,
          frets: legacyFrets,
          defaults: legacyDefaults,
          hasLegacyKeys,
        } = readLegacyInstrumentCore();

        if (!hasPersisted) {
          if (hasLegacyKeys) markLegacyInstrumentCoreKeysForCleanup();
          return {
            strings: legacyStrings.value,
            frets: legacyFrets.value,
            userDefaultTuningMap: legacyDefaults.value,
          };
        }
        const persistedNeckFilterMode =
          resolvePersistedNeckFilterMode(persistedState);

        return {
          ...persistedState,
          strings: clampNumeric(
            persistedState.strings,
            STR_MIN,
            STR_MAX,
            legacyStrings.value,
          ),
          frets: clampNumeric(
            persistedState.frets,
            FRETS_MIN,
            FRETS_MAX,
            legacyFrets.value,
          ),
          neckFilterMode: persistedNeckFilterMode,
          // The global map is always a plain object and always wins over the
          // per-window persisted copy.
          userDefaultTuningMap: legacyDefaults.value,
        };
      },
      partialize: (state) => ({
        strings: state.strings,
        frets: state.frets,
        neckFilterMode: state.neckFilterMode,
        userDefaultTuningMap: state.userDefaultTuningMap,
      }),
      merge: (persisted, current) => {
        if (!persisted) {
          return current;
        }
        const {
          strings: legacyStrings,
          frets: legacyFrets,
          defaults: legacyDefaults,
          hasLegacyKeys,
        } = readLegacyInstrumentCore();
        if (hasLegacyKeys) markLegacyInstrumentCoreKeysForCleanup();
        const mergedNeckFilterMode = resolvePersistedNeckFilterMode(persisted);

        return {
          ...current,
          ...persisted,
          strings: clampNumeric(
            persisted?.strings,
            STR_MIN,
            STR_MAX,
            legacyStrings.value,
          ),
          frets: clampNumeric(
            persisted?.frets,
            FRETS_MIN,
            FRETS_MAX,
            legacyFrets.value,
          ),
          neckFilterMode: mergedNeckFilterMode,
          userDefaultTuningMap: legacyDefaults.value,
        };
      },
      onRehydrateStorage: () => (_state, error) => {
        _state?.setHydrated?.(true);
        if (error) return;
        cleanupLegacyInstrumentCoreKeys();
      },
    },
  ),
);

export const selectInstrumentCoreState = (state) => ({
  strings: state.strings,
  frets: state.frets,
  isHydrated: state.isHydrated,
  fretsTouched: state.fretsTouched,
  tuning: state.tuning,
  tuningAtomicEpoch: state.tuningAtomicEpoch,
  stringMeta: state.stringMeta,
  boardMeta: state.boardMeta,
  neckFilterMode: state.neckFilterMode,
  userDefaultTuningMap: state.userDefaultTuningMap,
});

export const selectInstrumentCoreActions = (state) => ({
  setStrings: state.setStrings,
  setFrets: state.setFrets,
  setFretsTouched: state.setFretsTouched,
  setFretsUI: state.setFretsUI,
  setTuning: state.setTuning,
  setTuningAtomic: state.setTuningAtomic,
  setStringMeta: state.setStringMeta,
  updateStringMeta: state.updateStringMeta,
  setBoardMeta: state.setBoardMeta,
  setNeckFilterMode: state.setNeckFilterMode,
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
export const selectInstrumentTuningAtomicEpoch = (state) =>
  state.tuningAtomicEpoch;
export const selectInstrumentStringMeta = (state) => state.stringMeta;
export const selectInstrumentBoardMeta = (state) => state.boardMeta;
export const selectInstrumentDefaultTuningMap = (state) =>
  state.userDefaultTuningMap;
export const selectNeckFilterMode = (state) => state.neckFilterMode;
export const selectInstrumentCoreIsHydrated = (state) => state.isHydrated;
