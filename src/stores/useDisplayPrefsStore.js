import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { createGlobalStorage } from "@/lib/storage/scopedStorage";
import { DISPLAY_DEFAULTS } from "@/lib/config/appDefaults";
import { makeImmerSetters } from "@/utils/makeImmerSetters";
import { applyValueOrUpdaterOnDraft } from "@/utils/applyValueOrUpdaterOnDraft";

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
    immer((set, get) => {
      const setPrefs = (update) => {
        set((state) => {
          applyValueOrUpdaterOnDraft(state, "prefs", update);
        });
      };

      return {
        prefs: DISPLAY_DEFAULTS,
        setPrefs,
        resetPrefs: () => set({ prefs: DISPLAY_DEFAULTS }),
        setters: makeImmerSetters((updater) => setPrefs(updater), SETTER_KEYS),
        hydrateWithDefaults: (defaults) => {
          if (!defaults) return;
          const { prefs } = get();
          set({ prefs: { ...defaults, ...prefs } });
        },
      };
    }),
    {
      name: STORAGE_KEYS.DISPLAY_PREFS,
      storage: createJSONStorage(() => createGlobalStorage()),
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
export const selectDisplayResetPrefs = (state) => state.resetPrefs;
export const selectDisplaySetters = (state) => state.setters;
export const selectDisplayHydrateWithDefaults = (state) =>
  state.hydrateWithDefaults;
