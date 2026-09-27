import { useCallback, useEffect, useMemo, useState } from "react";
import { JsonEditor } from "json-edit-react";
import {
  useDebounce,
  useKey,
  useLatest,
  useToggle,
  useWindowSize,
} from "react-use";
import { parseTuningPack } from "@features/export/model/schema";
import { confirm } from "@shared/ui/confirm";
import { toast } from "react-hot-toast";
import { memoWithShallowPick } from "@shared/lib/memo";
import { FiAlertTriangle } from "react-icons/fi";
import ModalFrame from "@shared/ui/ModalFrame";
import { STR_MAX } from "@shared/config/appDefaults";
import NoteSelectNode from "@features/export/components/NoteSelectNode";
import PackEditorHelper from "@features/export/components/PackEditorHelper";
import {
  buildPackEditorIcons,
  buildPackEditorTheme,
} from "@features/export/components/packEditorTheme";
import {
  buildNoteOptionsForPack,
  ensurePack,
  buildTemplatePack,
  togglePackSpelling,
  getSeedSnapshot,
  isTuningNoteNode,
} from "@features/export/model/tuningPackNormalization";

function TuningPackEditorModal({
  isOpen,
  mode = "create",
  initialPack,
  originalName,
  onCancel,
  onSubmit,
  themeMode = "light",
}) {
  const [draft, setDraft] = useState(() => getSeedSnapshot(initialPack, mode));
  const [error, setError] = useState("");
  const [pointer, setPointer] = useState(null);
  const [isHelperCollapsed, toggleHelper] = useToggle(false);

  const [baselineSnapshotString, setBaselineSnapshotString] = useState(() =>
    JSON.stringify(getSeedSnapshot(initialPack, mode)),
  );

  const [draftString, setDraftString] = useState(() =>
    JSON.stringify(getSeedSnapshot(initialPack, mode)),
  );
  const [pendingDraftString, setPendingDraftString] = useState(draftString);
  const [validationMessage, setValidationMessage] = useState("");

  useDebounce(() => setDraftString(pendingDraftString), 120, [
    pendingDraftString,
  ]);

  const onCancelRef = useLatest(onCancel);
  const onSubmitRef = useLatest(onSubmit);

  useEffect(() => {
    if (isOpen) {
      const snapshot = getSeedSnapshot(initialPack, mode);
      const snapshotString = JSON.stringify(snapshot);
      setDraft(snapshot);
      setBaselineSnapshotString(snapshotString);
      setDraftString(snapshotString);
      setPendingDraftString(snapshotString);
      setError("");
      setPointer(null);
      setValidationMessage("");
    }
  }, [isOpen, initialPack, mode]);

  const hasUnsavedChanges = useMemo(
    () => isOpen && baselineSnapshotString !== draftString,
    [baselineSnapshotString, draftString, isOpen],
  );

  useDebounce(
    () => {
      try {
        parseTuningPack(draft);
        setValidationMessage("");
      } catch (e) {
        setValidationMessage(e?.message || "Invalid tuning pack.");
      }
    },
    150,
    [draft, draftString],
  );

  const handleCancel = useCallback(async () => {
    if (!isOpen) return;

    if (hasUnsavedChanges) {
      const shouldDiscard = await confirm({
        title: "Discard unsaved changes?",
        message:
          "You have unsaved edits to this tuning pack. Close the editor without saving?",
        confirmText: "Discard",
        cancelText: "Keep editing",
        toastId: "confirm-pack-editor-cancel",
        duration: Infinity,
      });

      if (!shouldDiscard) {
        toast("Continue editing to keep your changes.", {
          id: "warn-pack-editor-unsaved",
          duration: 4000,
          icon: <FiAlertTriangle size={20} color="var(--accent)" />,
        });
        return;
      }
    }

    onCancelRef.current?.();
  }, [hasUnsavedChanges, isOpen, onCancelRef]);

  const handleSave = useCallback(() => {
    if (validationMessage) {
      toast(validationMessage, {
        id: "warn-pack-editor-invalid",
        duration: 4000,
        icon: <FiAlertTriangle size={20} color="var(--accent)" />,
      });
      return;
    }

    try {
      const normalized = parseTuningPack(draft);
      onSubmitRef.current?.(normalized, {
        replaceName: mode === "edit" ? originalName : undefined,
      });
    } catch (e) {
      setError(e?.message || "Unable to save pack.");
    }
  }, [draft, mode, onSubmitRef, originalName, validationMessage]);

  useKey(
    (event) =>
      (event.key === "s" || event.key === "S") &&
      (event.metaKey || event.ctrlKey),
    (event) => {
      if (!isOpen) return;
      event.preventDefault();
      handleSave();
    },
    { event: "keydown" },
    [handleSave, isOpen],
  );

  const title = useMemo(
    () =>
      mode === "edit"
        ? `Edit custom pack${originalName ? `: ${originalName}` : ""}`
        : "Create custom pack",
    [mode, originalName],
  );

  const handleDataChange = useCallback((nextData) => {
    setDraft(ensurePack(nextData));
    try {
      setPendingDraftString(JSON.stringify(ensurePack(nextData)));
    } catch (serializationError) {
      const message =
        serializationError?.message ||
        "Unable to track changes in the current draft.";
      toast.error(message, {
        id: "pack-editor-track-error",
      });
    }
    setError("");
  }, []);

  const handleError = useCallback((props) => {
    const message = props?.error?.message ?? "Unable to update pack.";
    setError(message);
  }, []);

  const handleEditEvent = useCallback((path, isKey) => {
    if (!path) {
      setPointer(null);
      return;
    }

    const pointerParts = path
      .filter((part) => part !== undefined)
      .map((part) => {
        if (part === null) return "(new)";
        const value = String(part);
        return value.replace(/~/g, "~0").replace(/\//g, "~1");
      });

    const pointerText = `/${pointerParts.join("/")}`;
    setPointer(isKey ? `${pointerText} (key)` : pointerText);
  }, []);

  const isDark = themeMode === "dark";
  const editorTheme = useMemo(() => buildPackEditorTheme(isDark), [isDark]);
  const icons = useMemo(() => buildPackEditorIcons(isDark), [isDark]);

  const noteMeta = useMemo(() => buildNoteOptionsForPack(draft), [draft]);

  const noteNodeDefinitions = useMemo(() => {
    if (!noteMeta.noteOptions.length) return [];
    return [
      {
        condition: isTuningNoteNode,
        element: NoteSelectNode,
        customNodeProps: {
          noteOptions: noteMeta.noteOptions,
          systemLabel: noteMeta.systemLabel,
        },
        showOnEdit: true,
        showOnView: true,
        passOriginalNode: true,
      },
    ];
  }, [noteMeta]);

  const { height: winH } = useWindowSize();
  const editorMaxH = Math.max(240, winH - 280);
  const isSaveDisabled = Boolean(validationMessage);

  const handleInsertString = useCallback(() => {
    const pack = ensurePack(draft);
    const strings = Array.isArray(pack?.tuning?.strings)
      ? [...pack.tuning.strings]
      : [];

    if (strings.length >= STR_MAX) {
      toast(`You can include up to ${STR_MAX} strings in a pack.`, {
        id: "pack-editor-string-max",
      });
      return;
    }

    const nextIndex = strings.length + 1;
    strings.push({ label: `String ${nextIndex}`, note: "C4" });

    const nextPack = {
      ...pack,
      tuning: { ...pack.tuning, strings },
    };

    handleDataChange(nextPack);
  }, [draft, handleDataChange]);

  const handleResetTemplate = useCallback(() => {
    const nextPack = buildTemplatePack(draft);
    handleDataChange(nextPack);
    setPointer(null);
  }, [draft, handleDataChange]);

  const hasSpellingHint =
    typeof draft?.spelling === "string" && draft.spelling.trim().length > 0;

  const handleToggleSpellingHint = useCallback(() => {
    const nextPack = togglePackSpelling(draft, "de-h/b");
    handleDataChange(nextPack);
    setPointer("spelling");
    toast.success(
      hasSpellingHint
        ? "Removed spelling hint."
        : 'Set spelling hint to "de-h/b".',
    );
  }, [draft, handleDataChange, hasSpellingHint]);

  const handleToggleHelper = useCallback(() => {
    toggleHelper();
  }, [toggleHelper]);

  if (!isOpen) return null;

  return (
    <ModalFrame isOpen={isOpen} onClose={handleCancel} ariaLabel={title}>
      <header className="tv-modal__header">
        <h2>{title}</h2>
        <p className="tv-modal__summary">
          Edit the JSON to fine-tune your preset. Changes are applied using JSON
          Patch operations.
        </p>
      </header>
      <div className="tv-modal__body">
        <div
          className={`tv-modal__content-grid${
            isHelperCollapsed ? " is-helper-collapsed" : ""
          }`}
        >
          <PackEditorHelper
            isCollapsed={isHelperCollapsed}
            onToggle={handleToggleHelper}
            icons={icons}
            hasSpellingHint={hasSpellingHint}
            onInsertString={handleInsertString}
            onResetTemplate={handleResetTemplate}
            onToggleSpellingHint={handleToggleSpellingHint}
          />
          <div
            className="tv-modal__editor"
            style={{ maxHeight: editorMaxH, overflow: "auto" }}
          >
            <JsonEditor
              data={draft}
              setData={handleDataChange}
              onError={handleError}
              onEditEvent={handleEditEvent}
              theme={editorTheme}
              icons={icons}
              customNodeDefinitions={noteNodeDefinitions}
              className="tv-json-editor"
              showStringQuotes={false}
              enableClipboard
              indent={2}
            />
          </div>
        </div>
        <div className="tv-modal__status" role="status" aria-live="polite">
          {pointer ? <span>Focused: {pointer}</span> : <span>&nbsp;</span>}
          {validationMessage ? (
            <span className="tv-modal__error">{validationMessage}</span>
          ) : null}
          {error ? <span className="tv-modal__error">{error}</span> : null}
        </div>
      </div>
      <footer className="tv-modal__footer">
        <button type="button" className="tv-button" onClick={handleCancel}>
          Cancel
        </button>
        <button
          type="button"
          className="tv-button"
          onClick={handleSave}
          disabled={isSaveDisabled}
          aria-disabled={isSaveDisabled}
          title={isSaveDisabled ? validationMessage : undefined}
        >
          Save pack
        </button>
      </footer>
    </ModalFrame>
  );
}

function pick(p) {
  return {
    isOpen: p.isOpen,
    mode: p.mode,
    initialPack: p.initialPack,
    originalName: p.originalName,
    themeMode: p.themeMode,
    onCancel: p.onCancel,
    onSubmit: p.onSubmit,
  };
}

// Comparator strategy: shallow/reference-first checks for large modal payloads.
// Upstream should keep initialPack and submit/cancel handlers referentially stable.
const TuningPackEditorModalMemo = memoWithShallowPick(
  TuningPackEditorModal,
  pick,
);

export default TuningPackEditorModalMemo;
