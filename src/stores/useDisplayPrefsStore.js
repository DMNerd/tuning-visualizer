import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { DISPLAY_DEFAULTS } from "@/lib/config/appDefaults";
import { makeImmerSetters } from "@/utils/makeImmerSetters";
import { applyDraftUpdate } from "@/utils/applyDraftUpdate";

const SETTER_KEYS = [
  "show",
  "showOpen",
  "showFretNums",
  "dotSize",
  "accidental",
  "noteNaming",
  "microLabelStyle",
  "openOnlyInScale",
  "colorByDegree",
  "lefty",
];

export const useDisplayPrefsStore = create(
  persist(
    (set, get) => {
      const setPrefs = (update) => {
        set((state) => ({ prefs: applyDraftUpdate(state.prefs, update) }));
      };

      return {
        prefs: DISPLAY_DEFAULTS,
        setPrefs,
        setters: makeImmerSetters((updater) => setPrefs(updater), SETTER_KEYS),
        hydrateWithDefaults: (defaults) => {
          if (!defaults) return;
          const { prefs } = get();
          set({ prefs: { ...defaults, ...prefs } });
        },
      };
    },
    {
      name: STORAGE_KEYS.DISPLAY_PREFS,
      storage: createJSONStorage(() => globalThis.localStorage),
      partialize: (state) => ({ prefs: state.prefs }),
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        prefs: {
          ...DISPLAY_DEFAULTS,
          ...(persisted?.prefs || {}),
        },
      }),
    },
  ),
);

export const selectDisplayPrefs = (state) => state.prefs;
export const selectDisplaySetPrefs = (state) => state.setPrefs;
export const selectDisplaySetters = (state) => state.setters;
export const selectDisplayHydrateWithDefaults = (state) =>
  state.hydrateWithDefaults;
