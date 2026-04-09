import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { METRONOME_DEFAULTS } from "@/lib/config/appDefaults";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { createGlobalStorage } from "@/lib/storage/scopedStorage";
import { makeImmerSetters } from "@/utils/makeImmerSetters";
import { applyValueOrUpdaterOnDraft } from "@/utils/applyValueOrUpdaterOnDraft";

const SETTER_KEYS = [
  "bpm",
  "timeSig",
  "subdivision",
  "countInEnabled",
  "autoAdvanceEnabled",
  "barsPerScale",
  "announceCountInBeforeChange",
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
  if (typeof globalThis.localStorage === "undefined") return null;
  const raw = globalThis.localStorage.getItem(STORAGE_KEYS.METRONOME_PREFS);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { prefs: parsed };
    }
  } catch {
    return null;
  }

  return null;
}

let didHydrateLegacyMetronomePayload = false;

export const useMetronomePrefsStore = create(
  persist(
    immer((set, get) => {
      const setPrefs = (update) => {
        set((state) => {
          applyValueOrUpdaterOnDraft(state, "prefs", update);
        });
      };

      return {
        prefs: METRONOME_DEFAULTS,
        randomizeMode: RANDOMIZE_MODE_DEFAULT,
        _rehydrateRevision: 0,
        setPrefs,
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
        setters: makeImmerSetters((updater) => setPrefs(updater), SETTER_KEYS),
        touchMetronomePrefsState: () =>
          set((state) => {
            state._rehydrateRevision += 1;
          }),
        hydrateWithDefaults: (defaults) => {
          if (!defaults) return;
          const { prefs } = get();
          set({ prefs: { ...defaults, ...prefs } });
        },
      };
    }),
    {
      name: STORAGE_KEYS.METRONOME_PREFS,
      version: 1,
      storage: createJSONStorage(() => createGlobalStorage()),
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
        if (error || !state || !didHydrateLegacyMetronomePayload) return;
        didHydrateLegacyMetronomePayload = false;
        state.touchMetronomePrefsState();
      },
    },
  ),
);

export const selectMetronomePrefs = (state) => state.prefs;
export const selectMetronomeSetPrefs = (state) => state.setPrefs;
export const selectMetronomeResetPrefs = (state) => state.resetPrefs;
export const selectMetronomeRandomizeMode = (state) => state.randomizeMode;
export const selectMetronomeSetRandomizeMode = (state) =>
  state.setRandomizeMode;
export const selectMetronomeSetters = (state) => state.setters;
export const selectMetronomeHydrateWithDefaults = (state) =>
  state.hydrateWithDefaults;
