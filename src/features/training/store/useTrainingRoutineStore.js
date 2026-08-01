import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { STORAGE_KEYS } from "@shared/lib/storage/storageKeys";
import { createGlobalStorage } from "@shared/lib/storage/scopedStorage";

// Uses global (unscoped) storage, not per-window-scoped storage — "My
// Routines" is curated user data that should look identical in every tab,
// same as the custom tuning packs in useInstrumentWorkflowStore.
export const useTrainingRoutineStore = create(
  persist(
    immer((set) => ({
      routines: [],
      isHydrated: false,

      setHydrated: (value = true) => set({ isHydrated: Boolean(value) }),

      upsertRoutine: (routine) =>
        set((state) => {
          if (!routine || typeof routine !== "object") return;
          if (!Array.isArray(state.routines)) state.routines = [];

          const index = state.routines.findIndex((r) => r.id === routine.id);
          if (index >= 0) {
            state.routines[index] = routine;
          } else {
            state.routines.push(routine);
          }
        }),

      renameRoutine: (id, name) =>
        set((state) => {
          const target = state.routines?.find((r) => r.id === id);
          if (!target) return;
          target.name = typeof name === "string" ? name : "";
          target.updatedAt = Date.now();
        }),

      removeRoutine: (id) =>
        set((state) => {
          if (!Array.isArray(state.routines)) return;
          state.routines = state.routines.filter((r) => r.id !== id);
        }),

      resetTrainingRoutines: () => set({ routines: [] }),
    })),
    {
      name: STORAGE_KEYS.TRAINING_ROUTINES,
      version: 1,
      storage: createJSONStorage(() => createGlobalStorage()),
      partialize: (state) => ({ routines: state.routines }),
      merge: (persisted, current) => ({
        ...current,
        routines: Array.isArray(persisted?.routines) ? persisted.routines : [],
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) return;
        state?.setHydrated?.(true);
      },
    },
  ),
);

export const selectTrainingRoutinesList = (state) => state.routines;
export const selectTrainingRoutinesIsHydrated = (state) => state.isHydrated;
export const selectTrainingRoutinesActions = (state) => ({
  upsertRoutine: state.upsertRoutine,
  renameRoutine: state.renameRoutine,
  removeRoutine: state.removeRoutine,
  resetTrainingRoutines: state.resetTrainingRoutines,
});
