import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { migrateChordType } from "@domain/theory/chords";
import { migrateScaleFavoriteKey } from "@domain/theory/scales";
import { STORAGE_KEYS } from "@shared/lib/storage/storageKeys";
import { createGlobalStorage } from "@shared/lib/storage/scopedStorage";

const EMPTY = [];

function sanitizeFavorites(value) {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, keys]) => Array.isArray(keys))
      .map(([scope, keys]) => {
        const valid = keys.filter((key) => typeof key === "string");
        // scale labels and chord types saved by older versions
        const migrate =
          scope === "scale"
            ? migrateScaleFavoriteKey
            : scope === "chord"
              ? migrateChordType
              : null;
        return [scope, migrate ? [...new Set(valid.map(migrate))] : valid];
      }),
  );
}

// Starred dropdown options, as option keys per picker scope ("preset",
// "scale", "chord"). Global (unscoped) storage like routines and custom
// tunings — favourites are curated user data that should match in every tab.
export const useFavoritesStore = create(
  persist(
    immer((set) => ({
      favorites: {},

      toggleFavorite: (scope, key) =>
        set((state) => {
          if (typeof scope !== "string" || typeof key !== "string") return;
          const keys = state.favorites[scope] ?? [];
          state.favorites[scope] = keys.includes(key)
            ? keys.filter((k) => k !== key)
            : [...keys, key];
        }),

      resetFavorites: () => set({ favorites: {} }),
    })),
    {
      name: STORAGE_KEYS.FAVORITES,
      version: 1,
      storage: createJSONStorage(() => createGlobalStorage()),
      partialize: (state) => ({ favorites: state.favorites }),
      merge: (persisted, current) => ({
        ...current,
        favorites: sanitizeFavorites(persisted?.favorites),
      }),
    },
  ),
);

export const selectFavoriteKeys = (scope) => (state) =>
  state.favorites[scope] ?? EMPTY;
export const selectToggleFavorite = (state) => state.toggleFavorite;
