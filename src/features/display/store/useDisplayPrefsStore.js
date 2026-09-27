import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { STORAGE_KEYS } from "@shared/lib/storage/storageKeys";
import { createScopedStorage } from "@shared/lib/storage/scopedStorage";
import { DISPLAY_DEFAULTS } from "@shared/config/appDefaults";
import { createPrefsActions } from "@shared/lib/createPrefsActions";

const SETTER_KEYS = [
  "show",
  "showOpen",
  "showFretNums",
  "dotSize",
  "accidental",
  "noteNaming",
  "microLabelStyle",
  "openOnlyInMode",
  "colorByDegree",
  "colorByShape",
  "lefty",
];

// One-time upgrade for prefs persisted before openOnlyInScale/openOnlyInChord
// were unified into a single openOnlyInMode field — only runs when loading
// old localStorage data that predates the enum, never on fresh writes.
function migrateOpenOnlyPrefs(prefs) {
  if (!prefs || typeof prefs !== "object") return prefs;
  if ("openOnlyInMode" in prefs) return prefs;
  if (!("openOnlyInScale" in prefs) && !("openOnlyInChord" in prefs)) {
    return prefs;
  }
  const { openOnlyInScale, openOnlyInChord, ...rest } = prefs;
  return {
    ...rest,
    openOnlyInMode: openOnlyInChord
      ? "chord"
      : openOnlyInScale
        ? "scale"
        : "none",
  };
}

export const useDisplayPrefsStore = create(
  persist(
    immer((set, get) => ({
      ...createPrefsActions(set, get, DISPLAY_DEFAULTS, SETTER_KEYS),
      resetPrefs: () => set({ prefs: DISPLAY_DEFAULTS }),
    })),
    {
      name: STORAGE_KEYS.DISPLAY_PREFS,
      // Per-window-scoped, not global — matches useInstrumentCoreStore, so
      // display prefs can differ per tab instead of leaking across them.
      storage: createJSONStorage(() => createScopedStorage()),
      partialize: (state) => ({ prefs: state.prefs }),
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        prefs: {
          ...DISPLAY_DEFAULTS,
          ...migrateOpenOnlyPrefs(persisted?.prefs || {}),
        },
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated?.(true);
      },
    },
  ),
);

export const selectDisplayPrefs = (state) => state.prefs;
export const selectDisplaySetPrefs = (state) => state.setPrefs;
export const selectDisplayResetPrefs = (state) => state.resetPrefs;
export const selectDisplaySetters = (state) => state.setters;
export const selectDisplayHydrateWithDefaults = (state) =>
  state.hydrateWithDefaults;
export const selectDisplayIsHydrated = (state) => state.isHydrated;
