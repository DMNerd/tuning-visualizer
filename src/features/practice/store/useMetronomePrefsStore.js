import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { METRONOME_DEFAULTS } from "@shared/config/appDefaults";
import { STORAGE_KEYS } from "@shared/lib/storage/storageKeys";
import {
  createScopedStorage,
  readLegacyJSON,
} from "@shared/lib/storage/scopedStorage";
import { createPrefsActions } from "@shared/lib/createPrefsActions";
import { isPlainObject } from "@shared/lib/object";

const SETTER_KEYS = [
  "bpm",
  "timeSig",
  "subdivision",
  "countInEnabled",
  "autoAdvanceEnabled",
  "barsPerScale",
  "announceCountInBeforeChange",
  "timedPracticeEnabled",
  "practiceDurationMinutes",
];
const RANDOMIZE_MODE_DEFAULT = "both";
const RANDOMIZE_MODES = new Set(["both", "scale", "key"]);

function isValidRandomizeMode(value) {
  return typeof value === "string" && RANDOMIZE_MODES.has(value);
}

function normalizeLegacyShape(persisted) {
  if (!persisted) return null;

  if (persisted.prefs && typeof persisted.prefs === "object") {
    return persisted;
  }

  if (typeof persisted === "object" && !Array.isArray(persisted)) {
    return { prefs: persisted };
  }

  return null;
}

function readLegacyMetronomePrefs() {
  const parsed = readLegacyJSON(STORAGE_KEYS.METRONOME_PREFS);
  return isPlainObject(parsed) ? { prefs: parsed } : null;
}

let didHydrateLegacyMetronomePayload = false;

export const useMetronomePrefsStore = create(
  persist(
    immer((set, get) => ({
      ...createPrefsActions(set, get, METRONOME_DEFAULTS, SETTER_KEYS),
      randomizeMode: RANDOMIZE_MODE_DEFAULT,
      _rehydrateRevision: 0,
      setRandomizeMode: (randomizeMode) =>
        set({
          randomizeMode: isValidRandomizeMode(randomizeMode)
            ? randomizeMode
            : RANDOMIZE_MODE_DEFAULT,
        }),
      resetPrefs: () =>
        set({
          prefs: METRONOME_DEFAULTS,
          randomizeMode: RANDOMIZE_MODE_DEFAULT,
        }),
      touchMetronomePrefsState: () =>
        set((state) => {
          state._rehydrateRevision += 1;
        }),
    })),
    {
      name: STORAGE_KEYS.METRONOME_PREFS,
      version: 1,
      // Per-window-scoped, not global — matches useInstrumentCoreStore, so
      // metronome prefs can differ per tab instead of leaking across them.
      storage: createJSONStorage(() => createScopedStorage()),
      migrate: (persistedState) => {
        const normalized = normalizeLegacyShape(persistedState);
        if (normalized && !persistedState?.prefs) {
          didHydrateLegacyMetronomePayload = true;
        }
        return normalized;
      },
      partialize: (state) => ({
        prefs: state.prefs,
        randomizeMode: state.randomizeMode,
      }),
      merge: (persisted, current) => {
        let normalized = normalizeLegacyShape(persisted);
        if (!normalized) {
          normalized = readLegacyMetronomePrefs();
          if (normalized?.prefs) {
            didHydrateLegacyMetronomePayload = true;
          }
        }
        return {
          ...current,
          ...normalized,
          randomizeMode: isValidRandomizeMode(normalized?.randomizeMode)
            ? normalized.randomizeMode
            : RANDOMIZE_MODE_DEFAULT,
          prefs: {
            ...METRONOME_DEFAULTS,
            ...(normalized?.prefs || {}),
          },
        };
      },
      onRehydrateStorage: () => (state, error) => {
        state?.setHydrated?.(true);
        if (error || !state || !didHydrateLegacyMetronomePayload) return;
        didHydrateLegacyMetronomePayload = false;
        state.touchMetronomePrefsState();
      },
    },
  ),
);

export const selectMetronomePrefs = (state) => state.prefs;
export const selectMetronomeSetPrefs = (state) => state.setPrefs;
export const selectMetronomeRandomizeMode = (state) => state.randomizeMode;
export const selectMetronomeSetRandomizeMode = (state) =>
  state.setRandomizeMode;
export const selectMetronomeSetters = (state) => state.setters;
export const selectMetronomeHydrateWithDefaults = (state) =>
  state.hydrateWithDefaults;
