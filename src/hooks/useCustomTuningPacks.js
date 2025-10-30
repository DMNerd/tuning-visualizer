import { useCallback, useEffect, useState } from "react";
import { slug } from "@/lib/export/scales";
import { withToastPromise } from "@/utils/toast";

export function useCustomTuningPacks({
  confirm,
  getCurrentTuningPack,
  saveCustomTuning,
  deleteCustomTuning,
  clearCustomTunings,
  tuning,
  stringMeta,
  boardMeta,
  customTunings,
  customPresetNames,
  selectedPreset,
  queuePresetByName,
}) {
  const [editorState, setEditorState] = useState(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [pendingPresetName, setPendingPresetName] = useState(null);

  const openCreate = useCallback(() => {
    if (typeof getCurrentTuningPack !== "function") return;
    const pack = getCurrentTuningPack(tuning, stringMeta, boardMeta);
    setEditorState({
      mode: "create",
      initialPack: pack,
      originalName: null,
    });
  }, [getCurrentTuningPack, tuning, stringMeta, boardMeta]);

  const openEditSelected = useCallback(() => {
    if (!selectedPreset) return;
    if (!Array.isArray(customPresetNames)) return;
    if (!customPresetNames.includes(selectedPreset)) return;
    const existing = Array.isArray(customTunings)
      ? customTunings.find((pack) => pack?.name === selectedPreset)
      : null;
    if (!existing) return;
    setEditorState({
      mode: "edit",
      initialPack: existing,
      originalName: existing.name,
    });
  }, [selectedPreset, customPresetNames, customTunings]);

  const openManager = useCallback(() => {
    setIsManagerOpen(true);
  }, []);

  const closeManager = useCallback(() => {
    setIsManagerOpen(false);
  }, []);

  const editFromManager = useCallback((pack) => {
    if (!pack) return;
    const name = typeof pack?.name === "string" ? pack.name : null;
    setEditorState({
      mode: "edit",
      initialPack: pack,
      originalName: name,
    });
    setIsManagerOpen(false);
  }, []);

  const deletePack = useCallback(
    async (name) => {
      if (typeof deleteCustomTuning !== "function") return false;
      if (typeof name !== "string" || !name.trim()) return false;

      let ok = true;
      if (typeof confirm === "function") {
        ok = await confirm({
          title: "Remove custom tuning?",
          message:
            "This will permanently delete the selected custom tuning pack.",
          confirmText: "Remove pack",
          cancelText: "Cancel",
          toastId: `confirm-delete-${slug(name)}`,
        });
      }

      if (!ok) return false;

      return withToastPromise(
        () => Promise.resolve(deleteCustomTuning(name)),
        {
          loading: "Removing custom tuning…",
          success: "Custom tuning removed.",
          error: "Unable to remove custom tuning.",
        },
        `delete-custom-${slug(name)}`,
      ).then(() => {
        if (typeof queuePresetByName === "function") {
          queuePresetByName(null);
        }
        setPendingPresetName(null);
        return true;
      });
    },
    [confirm, deleteCustomTuning, queuePresetByName],
  );

  const cancelEditor = useCallback(() => {
    setEditorState(null);
  }, []);

  const submitEditor = useCallback(
    (pack, options = {}) => {
      const replaceName =
        options?.replaceName ?? editorState?.originalName ?? undefined;
      const mode = editorState?.mode === "edit" ? "edit" : "create";

      return withToastPromise(
        () => saveCustomTuning(pack, { replaceName }),
        {
          loading:
            mode === "edit" ? "Updating custom pack…" : "Saving custom pack…",
          success:
            mode === "edit" ? "Custom pack updated." : "Custom pack created.",
          error: "Unable to save tuning pack.",
        },
        "save-custom-pack",
      ).then((saved) => {
        const nextName = saved?.name ?? pack?.name ?? null;
        if (typeof queuePresetByName === "function") {
          queuePresetByName(nextName);
        }
        setPendingPresetName(nextName);
        setEditorState(null);
        return saved;
      });
    },
    [editorState, saveCustomTuning, queuePresetByName],
  );

  const clearAllPacks = useCallback(async () => {
    if (typeof clearCustomTunings !== "function") return false;

    if (typeof confirm === "function") {
      const ok = await confirm({
        title: "Clear all custom tunings?",
        message:
          "This will permanently remove every saved custom tuning pack. This action cannot be undone.",
        confirmText: "Clear custom tunings",
        cancelText: "Cancel",
        toastId: "confirm-clear-custom",
      });

      if (!ok) return false;
    }

    return withToastPromise(
      () => Promise.resolve(clearCustomTunings()),
      {
        loading: "Clearing custom tunings…",
        success: "Custom tunings cleared.",
        error: "Unable to clear custom tunings.",
      },
      "clear-custom-tunings",
    ).then(() => {
      if (typeof queuePresetByName === "function") {
        queuePresetByName(null);
      }
      setPendingPresetName(null);
      return true;
    });
  }, [clearCustomTunings, confirm, queuePresetByName]);

  useEffect(() => {
    if (!pendingPresetName) return;
    if (pendingPresetName === selectedPreset) {
      setPendingPresetName(null);
      return;
    }
    if (!Array.isArray(customPresetNames)) return;
    if (typeof queuePresetByName !== "function") return;
    if (!customPresetNames.includes(pendingPresetName)) return;

    queuePresetByName(pendingPresetName);
    setPendingPresetName(null);
  }, [
    customPresetNames,
    pendingPresetName,
    queuePresetByName,
    selectedPreset,
  ]);

  return {
    editorState,
    isManagerOpen,
    openCreate,
    openEditSelected,
    openManager,
    closeManager,
    editFromManager,
    deletePack,
    clearAllPacks,
    submitEditor,
    cancelEditor,
    pendingPresetName,
    setPendingPresetName,
  };
}