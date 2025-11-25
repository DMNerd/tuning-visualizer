import { useCallback, useEffect, useState } from "react";
import { useToggle, useLatest, useMountedState } from "react-use";
import { slug } from "@/lib/export/scales";
import { withToastPromise } from "@/utils/toast";

function resolvePackLabel(target) {
  if (target && typeof target === "object") {
    const name = typeof target?.name === "string" ? target.name.trim() : "";
    const displayName =
      typeof target?.displayName === "string"
        ? target.displayName.trim()
        : name
          ? ""
          : "Untitled pack";
    return name || displayName;
  }

  if (typeof target === "string") {
    return target.trim();
  }

  return "";
}

function resolvePackKey(target) {
  if (target && typeof target === "object") {
    const id =
      typeof target?.meta?.id === "string" ? target.meta.id.trim() : "";
    if (id) return id;
  }

  const label = resolvePackLabel(target);
  return label || "custom-tuning";
}

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
  const [isManagerOpen, toggleManager] = useToggle(false);
  const [pendingPresetName, setPendingPresetName] = useState(null);

  const confirmRef = useLatest(confirm);
  const getCurrentTuningPackRef = useLatest(getCurrentTuningPack);
  const saveCustomTuningRef = useLatest(saveCustomTuning);
  const deleteCustomTuningRef = useLatest(deleteCustomTuning);
  const clearCustomTuningsRef = useLatest(clearCustomTunings);
  const queuePresetByNameRef = useLatest(queuePresetByName);

  const isMounted = useMountedState();

  const openCreate = useCallback(() => {
    if (typeof getCurrentTuningPackRef.current !== "function") return;
    const pack = getCurrentTuningPackRef.current(tuning, stringMeta, boardMeta);
    setEditorState({
      mode: "create",
      initialPack: pack,
      originalName: null,
    });
  }, [boardMeta, stringMeta, tuning, getCurrentTuningPackRef]);

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
    toggleManager(true);
  }, [toggleManager]);

  const closeManager = useCallback(() => {
    toggleManager(false);
  }, [toggleManager]);

  const editFromManager = useCallback(
    (pack) => {
      if (!pack) return;
      const name = typeof pack?.name === "string" ? pack.name : null;
      setEditorState({
        mode: "edit",
        initialPack: pack,
        originalName: name,
      });
      toggleManager(false);
    },
    [toggleManager],
  );

  const runWithCleanup = useCallback(
    (operation, toastConfig, toastId) =>
      withToastPromise(
        () => Promise.resolve(operation?.()),
        toastConfig,
        toastId,
      ).then((result) => {
        if (!isMounted()) return result;
        queuePresetByNameRef.current?.(null);
        setPendingPresetName(null);
        return result;
      }),
    [isMounted, queuePresetByNameRef],
  );

  const deletePack = useCallback(
    async (target) => {
      if (typeof deleteCustomTuningRef.current !== "function") return false;
      if (typeof target === "string" && !target.trim()) return false;
      if (!target) return false;

      const label = resolvePackLabel(target) || "this tuning pack";
      const key = slug(resolvePackKey(target));

      let ok = true;
      if (typeof confirmRef.current === "function") {
        ok = await confirmRef.current({
          title: "Remove custom tuning?",
          message:
            "This will permanently delete the selected custom tuning pack.",
          confirmText: "Remove pack",
          cancelText: "Cancel",
          toastId: `confirm-delete-${key}`,
        });
      }
      if (!ok) return false;

      return runWithCleanup(
        () => deleteCustomTuningRef.current(target),
        {
          loading: `Removing ${label}…`,
          success: "Custom tuning removed.",
          error: "Unable to remove custom tuning.",
        },
        `delete-custom-${key}`,
      );
    },
    [confirmRef, deleteCustomTuningRef, runWithCleanup],
  );

  const cancelEditor = useCallback(() => {
    setEditorState(null);
  }, []);

  const submitEditor = useCallback(
    async (pack, options = {}) => {
      const replaceName =
        options?.replaceName ?? editorState?.originalName ?? undefined;
      const mode = editorState?.mode === "edit" ? "edit" : "create";

      const saved = await withToastPromise(
        () => saveCustomTuningRef.current(pack, { replaceName }),
        {
          loading:
            mode === "edit" ? "Updating custom pack…" : "Saving custom pack…",
          success:
            mode === "edit" ? "Custom pack updated." : "Custom pack created.",
          error: "Unable to save tuning pack.",
        },
        "save-custom-pack",
      );

      if (!isMounted()) return saved;

      const nextName = saved?.name ?? pack?.name ?? null;
      queuePresetByNameRef.current?.(nextName);
      setPendingPresetName(nextName);
      setEditorState(null);
      return saved;
    },
    [editorState, isMounted, saveCustomTuningRef, queuePresetByNameRef],
  );

  const clearAllPacks = useCallback(async () => {
    if (typeof clearCustomTuningsRef.current !== "function") return false;

    if (typeof confirmRef.current === "function") {
      const ok = await confirmRef.current({
        title: "Clear all custom tunings?",
        message:
          "This will permanently remove every saved custom tuning pack. This action cannot be undone.",
        confirmText: "Clear custom tunings",
        cancelText: "Cancel",
        toastId: "confirm-clear-custom",
      });
      if (!ok) return false;
    }

    return runWithCleanup(
      () => clearCustomTuningsRef.current(),
      {
        loading: "Clearing custom tunings…",
        success: "Custom tunings cleared.",
        error: "Unable to clear custom tunings.",
      },
      "clear-custom-tunings",
    );
  }, [confirmRef, clearCustomTuningsRef, runWithCleanup]);

  useEffect(() => {
    if (!pendingPresetName) return;
    if (pendingPresetName === selectedPreset) {
      setPendingPresetName(null);
      return;
    }
    if (!Array.isArray(customPresetNames)) return;
    if (!customPresetNames.includes(pendingPresetName)) return;

    queuePresetByNameRef.current?.(pendingPresetName);
    setPendingPresetName(null);
  }, [
    customPresetNames,
    pendingPresetName,
    selectedPreset,
    queuePresetByNameRef,
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
