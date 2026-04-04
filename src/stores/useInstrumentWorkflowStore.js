import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { makeImmerSetters } from "@/utils/makeImmerSetters";
import { applyValueOrUpdaterOnDraft } from "@/utils/applyValueOrUpdaterOnDraft";

function readLegacyCustomTunings() {
  if (typeof globalThis.localStorage === "undefined") return null;
  const raw = globalThis.localStorage.getItem(STORAGE_KEYS.CUSTOM_TUNINGS);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

let didHydrateLegacyWorkflowPayload = false;

export const useInstrumentWorkflowStore = create(
  persist(
    immer((set) => {
      const setWithDraft = (updater) =>
        set((state) => {
          updater(state);
        });
      const baseSetters = makeImmerSetters(setWithDraft, {
        selectedPreset: "setSelectedPreset",
        queuedPresetName: "setQueuedPresetName",
        editorState: "setEditorState",
        isManagerOpen: "setManagerOpen",
        pendingPresetName: "setPendingPresetName",
      });
      return {
        customTunings: [],
        _rehydrateRevision: 0,
        selectedPreset: "Factory default",
        queuedPresetName: null,
        editorState: null,
        isManagerOpen: false,
        pendingPresetName: null,

        setCustomTunings: (valueOrUpdater) =>
          set((state) => {
            applyValueOrUpdaterOnDraft(state, "customTunings", valueOrUpdater);
          }),
        updateCustomTunings: (draftUpdater) =>
          set((state) => {
            applyValueOrUpdaterOnDraft(state, "customTunings", draftUpdater);
          }),
        upsertCustomTuning: (pack) =>
          set((state) => {
            if (!pack || typeof pack !== "object") return;

            if (!Array.isArray(state.customTunings)) {
              state.customTunings = [];
            }

            const list = state.customTunings;
            const packId =
              typeof pack?.meta?.id === "string" ? pack.meta.id.trim() : "";
            const packName =
              typeof pack?.name === "string" ? pack.name.trim() : "";
            const index = list.findIndex((entry) => {
              const entryId =
                typeof entry?.meta?.id === "string" ? entry.meta.id.trim() : "";
              if (packId && entryId) return entryId === packId;
              const entryName =
                typeof entry?.name === "string" ? entry.name.trim() : "";
              return !!packName && entryName === packName;
            });
            if (index >= 0) {
              list[index] = pack;
            } else {
              list.push(pack);
            }
          }),
        removeCustomTuning: (identifier) =>
          set((state) => {
            if (!Array.isArray(state.customTunings)) return;

            const id =
              typeof identifier?.meta?.id === "string"
                ? identifier.meta.id.trim()
                : typeof identifier?.name === "string"
                  ? identifier.name.trim()
                  : typeof identifier === "string"
                    ? identifier.trim()
                    : "";

            if (!id) return;

            let removedAny = false;
            for (
              let index = state.customTunings.length - 1;
              index >= 0;
              index -= 1
            ) {
              const entry = state.customTunings[index];
              const entryId =
                typeof entry?.meta?.id === "string" ? entry.meta.id.trim() : "";
              const entryName =
                typeof entry?.name === "string" ? entry.name.trim() : "";

              const isMatch = entryId ? entryId === id : entryName === id;
              if (isMatch) {
                state.customTunings.splice(index, 1);
                removedAny = true;
              }
            }

            if (!removedAny) return;
          }),
        touchWorkflowState: () =>
          set((state) => {
            state._rehydrateRevision += 1;
          }),
        resetWorkflow: () =>
          set({
            customTunings: [],
            selectedPreset: "Factory default",
            queuedPresetName: null,
            editorState: null,
            isManagerOpen: false,
            pendingPresetName: null,
          }),
        ...baseSetters,
      };
    }),
    {
      name: STORAGE_KEYS.CUSTOM_TUNINGS,
      version: 1,
      storage: createJSONStorage(() => globalThis.localStorage),
      migrate: (persistedState) => {
        if (Array.isArray(persistedState)) {
          didHydrateLegacyWorkflowPayload = true;
          return { customTunings: persistedState };
        }
        return persistedState;
      },
      partialize: (state) => ({ customTunings: state.customTunings }),
      merge: (persisted, current) => {
        const legacyTunings = readLegacyCustomTunings();
        if (!persisted && Array.isArray(legacyTunings)) {
          didHydrateLegacyWorkflowPayload = true;
        }
        return {
          ...current,
          customTunings: Array.isArray(persisted)
            ? persisted
            : Array.isArray(persisted?.customTunings)
              ? persisted.customTunings
              : legacyTunings || [],
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error || !state || !didHydrateLegacyWorkflowPayload) return;
        didHydrateLegacyWorkflowPayload = false;
        state.touchWorkflowState();
      },
    },
  ),
);

export const selectInstrumentWorkflowState = (state) => ({
  customTunings: state.customTunings,
  selectedPreset: state.selectedPreset,
  queuedPresetName: state.queuedPresetName,
  editorState: state.editorState,
  isManagerOpen: state.isManagerOpen,
  pendingPresetName: state.pendingPresetName,
});

export const selectInstrumentWorkflowActions = (state) => ({
  setCustomTunings: state.setCustomTunings,
  updateCustomTunings: state.updateCustomTunings,
  upsertCustomTuning: state.upsertCustomTuning,
  removeCustomTuning: state.removeCustomTuning,
  setSelectedPreset: state.setSelectedPreset,
  setQueuedPresetName: state.setQueuedPresetName,
  setEditorState: state.setEditorState,
  setManagerOpen: state.setManagerOpen,
  setPendingPresetName: state.setPendingPresetName,
  resetWorkflow: state.resetWorkflow,
});

export const selectWorkflowCustomTunings = (state) => state.customTunings;
export const selectWorkflowSelectedPreset = (state) => state.selectedPreset;
export const selectWorkflowQueuedPresetName = (state) => state.queuedPresetName;
export const selectWorkflowEditorState = (state) => state.editorState;
export const selectWorkflowManagerOpen = (state) => state.isManagerOpen;
export const selectWorkflowPendingPresetName = (state) =>
  state.pendingPresetName;
