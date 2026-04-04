import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { makeImmerSetters } from "@/utils/makeImmerSetters";
import { applyDraftUpdate } from "@/utils/applyDraftUpdate";

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
    (set) => {
      const baseSetters = makeImmerSetters(
        (updater) =>
          set((state) => {
            const draft = {
              selectedPreset: state.selectedPreset,
              queuedPresetName: state.queuedPresetName,
              editorState: state.editorState,
              isManagerOpen: state.isManagerOpen,
              pendingPresetName: state.pendingPresetName,
            };
            updater(draft);
            return draft;
          }),
        {
          selectedPreset: "setSelectedPreset",
          queuedPresetName: "setQueuedPresetName",
          editorState: "setEditorState",
          isManagerOpen: "setManagerOpen",
          pendingPresetName: "setPendingPresetName",
        },
      );
      return {
        customTunings: [],
        selectedPreset: "Factory default",
        queuedPresetName: null,
        editorState: null,
        isManagerOpen: false,
        pendingPresetName: null,

        setCustomTunings: (valueOrUpdater) =>
          set((state) => ({
            customTunings: applyDraftUpdate(state.customTunings, valueOrUpdater),
          })),
        updateCustomTunings: (draftUpdater) =>
          set((state) => ({
            customTunings: applyDraftUpdate(state.customTunings, draftUpdater),
          })),
        upsertCustomTuning: (pack) =>
          set((state) => {
            if (!pack || typeof pack !== "object") return {};
            const list = Array.isArray(state.customTunings)
              ? [...state.customTunings]
              : [];
            const packId =
              typeof pack?.meta?.id === "string" ? pack.meta.id.trim() : "";
            const packName = typeof pack?.name === "string" ? pack.name.trim() : "";
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
            return { customTunings: list };
          }),
        removeCustomTuning: (identifier) =>
          set((state) => {
            const list = Array.isArray(state.customTunings)
              ? state.customTunings
              : [];
            const id =
              typeof identifier?.meta?.id === "string"
                ? identifier.meta.id.trim()
                : typeof identifier?.name === "string"
                  ? identifier.name.trim()
                : typeof identifier === "string"
                  ? identifier.trim()
                  : "";
            const filtered = list.filter((entry) => {
              const entryId =
                typeof entry?.meta?.id === "string" ? entry.meta.id.trim() : "";
              const entryName =
                typeof entry?.name === "string" ? entry.name.trim() : "";
              if (id && entryId) return entryId !== id;
              if (id) return entryName !== id;
              return true;
            });
            return filtered.length === list.length
              ? {}
              : { customTunings: filtered };
          }),
        ...baseSetters,
      };
    },
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
        state.setCustomTunings((prev) => [...prev]);
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
});

export const selectWorkflowCustomTunings = (state) => state.customTunings;
export const selectWorkflowSelectedPreset = (state) => state.selectedPreset;
export const selectWorkflowQueuedPresetName = (state) =>
  state.queuedPresetName;
export const selectWorkflowEditorState = (state) => state.editorState;
export const selectWorkflowManagerOpen = (state) => state.isManagerOpen;
export const selectWorkflowPendingPresetName = (state) =>
  state.pendingPresetName;
