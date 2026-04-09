import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { createGlobalStorage } from "@/lib/storage/scopedStorage";

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: "auto",
      setTheme: (theme) => set({ theme }),
      resetTheme: () => set({ theme: "auto" }),
    }),
    {
      name: STORAGE_KEYS.THEME,
      storage: createJSONStorage(() => createGlobalStorage()),
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);

export const selectTheme = (state) => state.theme;
export const selectSetTheme = (state) => state.setTheme;
export const selectResetTheme = (state) => state.resetTheme;
