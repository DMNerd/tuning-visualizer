import { useCallback, useEffect } from "react";
import { useLatest, useMountedState } from "react-use";
import { useShallow } from "zustand/react/shallow";
import { slug } from "@features/export";
import i18n from "@shared/i18n";
import { withToastPromise } from "@shared/lib/toast";
import {
  useInstrumentWorkflowStore,
  selectInstrumentWorkflowActions,
  selectWorkflowEditorState,
  selectWorkflowManagerOpen,
  selectWorkflowPendingPresetName,
} from "@features/instrument/store/useInstrumentWorkflowStore";
import {
  resolvePackKey,
  resolvePackLabel,
} from "@features/instrument/model/packNaming";

export function useCustomTuningPacks({
  confirm,
  getCurrentTuningPack,
  saveCustomTuning,
  deleteCustomTuning,
  tuning,
  stringMeta,
  boardMeta,
  customTunings,
  customPresetNames,
  selectedPreset,
  queuePresetByName,
}) {
  const editorState = useInstrumentWorkflowStore(selectWorkflowEditorState);
  const isManagerOpen = useInstrumentWorkflowStore(selectWorkflowManagerOpen);
  const pendingPresetName = useInstrumentWorkflowStore(
    selectWorkflowPendingPresetName,
  );
  const { setEditorState, setManagerOpen, setPendingPresetName } =
    useInstrumentWorkflowStore(useShallow(selectInstrumentWorkflowActions));

  const confirmRef = useLatest(confirm);
  const getCurrentTuningPackRef = useLatest(getCurrentTuningPack);
  const saveCustomTuningRef = useLatest(saveCustomTuning);
  const deleteCustomTuningRef = useLatest(deleteCustomTuning);
  const queuePresetByNameRef = useLatest(queuePresetByName);

  const isMounted = useMountedState();

  // Proceeds without prompting when no confirm function was supplied.
  const confirmIfAvailable = useCallback(
    (options) =>
      typeof confirmRef.current === "function"
        ? confirmRef.current(options)
        : true,
    [confirmRef],
  );

  const openCreate = useCallback(() => {
    if (typeof getCurrentTuningPackRef.current !== "function") return;
    const pack = getCurrentTuningPackRef.current(tuning, stringMeta, boardMeta);
    setEditorState({
      mode: "create",
      initialPack: pack,
      originalName: null,
    });
  }, [boardMeta, stringMeta, tuning, getCurrentTuningPackRef, setEditorState]);

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
  }, [selectedPreset, customPresetNames, customTunings, setEditorState]);

  const openManager = useCallback(() => {
    setManagerOpen(true);
  }, [setManagerOpen]);

  const closeManager = useCallback(() => {
    setManagerOpen(false);
  }, [setManagerOpen]);

  const editFromManager = useCallback(
    (pack) => {
      if (!pack) return;
      const name = typeof pack?.name === "string" ? pack.name : null;
      setEditorState({
        mode: "edit",
        initialPack: pack,
        originalName: name,
      });
      setManagerOpen(false);
    },
    [setEditorState, setManagerOpen],
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
    [isMounted, queuePresetByNameRef, setPendingPresetName],
  );

  const deletePack = useCallback(
    async (target) => {
      if (typeof deleteCustomTuningRef.current !== "function") return false;
      if (typeof target === "string" && !target.trim()) return false;
      if (!target) return false;

      const label = resolvePackLabel(target) || i18n.t("packs.thisPack");
      const key = slug(resolvePackKey(target));

      const ok = await confirmIfAvailable({
        title: i18n.t("packs.removeTitle"),
        message: i18n.t("packs.removeMessage"),
        confirmText: i18n.t("packs.removeConfirm"),
        cancelText: i18n.t("common.cancel"),
        toastId: `confirm-delete-${key}`,
      });
      if (!ok) return false;

      return runWithCleanup(
        () => deleteCustomTuningRef.current(target),
        {
          loading: i18n.t("packs.removeLoading", { name: label }),
          success: i18n.t("packs.removeSuccess"),
          error: i18n.t("packs.removeError"),
        },
        `delete-custom-${key}`,
      );
    },
    [confirmIfAvailable, deleteCustomTuningRef, runWithCleanup],
  );

  const cancelEditor = useCallback(() => {
    setEditorState(null);
  }, [setEditorState]);

  const submitEditor = useCallback(
    async (pack, options = {}) => {
      const replaceName =
        options?.replaceName ?? editorState?.originalName ?? undefined;
      const mode = editorState?.mode === "edit" ? "edit" : "create";

      const saved = await withToastPromise(
        () => saveCustomTuningRef.current(pack, { replaceName }),
        {
          loading:
            mode === "edit"
              ? i18n.t("packs.updateLoading")
              : i18n.t("packs.saveLoading"),
          success:
            mode === "edit"
              ? i18n.t("packs.updateSuccess")
              : i18n.t("packs.createSuccess"),
          error: i18n.t("packs.saveError"),
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
    [
      editorState,
      isMounted,
      saveCustomTuningRef,
      queuePresetByNameRef,
      setEditorState,
      setPendingPresetName,
    ],
  );

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
    setPendingPresetName,
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
    submitEditor,
    cancelEditor,
    pendingPresetName,
    setPendingPresetName,
  };
}
