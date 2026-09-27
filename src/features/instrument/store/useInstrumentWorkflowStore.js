import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { STORAGE_KEYS } from "@shared/lib/storage/storageKeys";
import {
  createGlobalStorage,
  readLegacyJSON,
} from "@shared/lib/storage/scopedStorage";
import { makeImmerSetters } from "@shared/lib/makeImmerSetters";
import { applyValueOrUpdaterOnDraft } from "@shared/lib/applyValueOrUpdaterOnDraft";

function readLegacyCustomTunings() {
  const parsed = readLegacyJSON(STORAGE_KEYS.CUSTOM_TUNINGS);
  return Array.isArray(parsed) ? parsed : null;
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
      storage: createJSONStorage(() => createGlobalStorage()),
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
