import { useCallback, useEffect, useMemo, useState, useId } from "react";
import { JsonEditor } from "json-edit-react";
import { useKey, useLatest, useDebounce, useWindowSize } from "react-use";
import { parseTuningPack } from "@/lib/export/schema";
import { useConfirm } from "@/hooks/useConfirm";
import { toast } from "react-hot-toast";
import { memoWithPick } from "@/utils/memo";
import {
  TUNINGS,
  nameFallback,
  findSystemByEdo,
  getSystemLabel,
} from "@/lib/theory/tuning";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiClipboard,
  FiCheck,
  FiX,
  FiChevronRight,
  FiAlertTriangle,
} from "react-icons/fi";
import { isPlainObject } from "@/utils/object";
import ModalFrame from "@/components/UI/modals/ModalFrame";

function clonePack(pack) {
  if (!pack) return null;
  if (typeof structuredClone === "function") {
    return structuredClone(pack);
  }
  return JSON.parse(JSON.stringify(pack));
}

function ensurePack(pack) {
  const base = {
    name: "",
    system: { edo: 12 },
    tuning: { strings: [] },
    meta: {},
  };

  if (!isPlainObject(pack)) {
    return base;
  }

  const name = typeof pack.name === "string" ? pack.name : "";

  const edo = Number(pack?.system?.edo);
  const system = Number.isFinite(edo) && edo > 0 ? { edo } : { edo: 12 };

  const strings = Array.isArray(pack?.tuning?.strings)
    ? pack.tuning.strings
    : [];

  const meta = isPlainObject(pack.meta) ? pack.meta : {};

  return {
    name,
    system,
    tuning: { strings },
    meta,
  };
}

function pushUnique(list, seen, value) {
  if (typeof value !== "string") return;
  const normalized = value.trim();
  if (!normalized.length || seen.has(normalized)) return;
  seen.add(normalized);
  list.push(normalized);
}

function buildNoteNodeMetadata(pack) {
  const strings = Array.isArray(pack?.tuning?.strings)
    ? pack.tuning.strings
    : [];
  const edo = Number(pack?.system?.edo);
  const metaSystemId =
    typeof pack?.meta?.systemId === "string" ? pack.meta.systemId : null;
  const systemMatch = findSystemByEdo(TUNINGS, edo, metaSystemId);
  const system = systemMatch?.system ?? null;
  const seen = new Set();
  const options = [];

  if (system && Number.isFinite(system.divisions) && system.divisions > 0) {
    for (let pc = 0; pc < system.divisions; pc += 1) {
      pushUnique(options, seen, system.nameForPc(pc, "sharp"));
      pushUnique(options, seen, system.nameForPc(pc, "flat"));
    }
  } else if (Number.isFinite(edo) && edo > 0) {
    for (let pc = 0; pc < edo; pc += 1) {
      pushUnique(options, seen, nameFallback(pc));
    }
  }

  strings.forEach((entry) => {
    pushUnique(options, seen, entry?.note);
  });

  const systemLabel = getSystemLabel({
    match: systemMatch,
    edo,
    metaSystemId,
  });

  return { noteOptions: options, systemLabel };
}

function isTuningNoteNode({ key, path }) {
  if (key !== "note" || !Array.isArray(path)) return false;
  if (path.length < 3) return false;

  const last = path[path.length - 1];
  const prev = path[path.length - 2];
  const prev2 = path[path.length - 3];
  const prev3 = path[path.length - 4];

  if (last === "note") {
    return (
      prev2 === "strings" &&
      prev3 === "tuning" &&
      (typeof prev === "number" || prev === null)
    );
  }

  return path.includes("tuning") && path.includes("strings");
}

function NoteSelectNode({
  value,
  setValue,
  handleEdit,
  handleKeyPress,
  isEditing,
  canEdit,
  originalNode,
  customNodeProps,
  getStyles,
  nodeData,
}) {
  const { noteOptions = [], systemLabel } = customNodeProps ?? {};
  const selectId = useId();
  const stringStyles = getStyles("string", nodeData);
  const currentValue = typeof value === "string" ? value : "";

  const options = useMemo(() => {
    const seen = new Set();
    const list = [];
    noteOptions.forEach((option) => pushUnique(list, seen, option));
    if (currentValue && !seen.has(currentValue)) {
      list.push(currentValue);
    }
    return list;
  }, [noteOptions, currentValue]);

  if (!canEdit) {
    return (
      originalNode ?? <span style={stringStyles}>{currentValue || ""}</span>
    );
  }

  if (!isEditing) {
    return (
      originalNode ?? <span style={stringStyles}>{currentValue || ""}</span>
    );
  }

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setValue(nextValue);
    handleEdit(nextValue);
  };

  return (
    <div className="tv-json-editor__note-editor">
      <select
        id={selectId}
        className="tv-json-editor__note-select"
        value={currentValue || ""}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        autoFocus
      >
        <option value="" disabled>
          Select note…
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {systemLabel ? (
        <span className="tv-json-editor__note-hint">{systemLabel}</span>
      ) : null}
    </div>
  );
}

function TuningPackEditorModal({
  isOpen,
  mode = "create",
  initialPack,
  originalName,
  onCancel,
  onSubmit,
  themeMode = "light",
}) {
  const [draft, setDraft] = useState(() => ensurePack(initialPack));
  const [error, setError] = useState("");
  const [pointer, setPointer] = useState(null);

  const [baselineSnapshotString, setBaselineSnapshotString] = useState(() =>
    JSON.stringify(ensurePack(initialPack)),
  );

  const [draftString, setDraftString] = useState(() =>
    JSON.stringify(ensurePack(initialPack)),
  );
  const [pendingDraftString, setPendingDraftString] = useState(draftString);

  useDebounce(() => setDraftString(pendingDraftString), 120, [
    pendingDraftString,
  ]);

  const { confirm } = useConfirm();

  const onCancelRef = useLatest(onCancel);
  const onSubmitRef = useLatest(onSubmit);
  const confirmRef = useLatest(confirm);

  useEffect(() => {
    if (isOpen) {
      const snapshot = ensurePack(clonePack(initialPack));
      const snapshotString = JSON.stringify(snapshot);
      setDraft(snapshot);
      setBaselineSnapshotString(snapshotString);
      setDraftString(snapshotString);
      setPendingDraftString(snapshotString);
      setError("");
      setPointer(null);
    }
  }, [isOpen, initialPack]);

  const hasUnsavedChanges = useMemo(
    () => isOpen && baselineSnapshotString !== draftString,
    [baselineSnapshotString, draftString, isOpen],
  );

  const handleCancel = useCallback(async () => {
    if (!isOpen) return;

    if (hasUnsavedChanges) {
      const shouldDiscard = await confirmRef.current?.({
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
  }, [confirmRef, hasUnsavedChanges, isOpen, onCancelRef]);

  const handleSave = useCallback(() => {
    try {
      const normalized = parseTuningPack(draft);
      onSubmitRef.current?.(normalized, {
        replaceName: mode === "edit" ? originalName : undefined,
      });
    } catch (e) {
      setError(e?.message || "Unable to save pack.");
    }
  }, [draft, mode, originalName, onSubmitRef]);

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
    [isOpen, handleSave],
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

  const editorTheme = useMemo(() => {
    const baseBoolean = "#0f766e";
    const baseNumber = "#2563eb";
    const baseNull = "#b91c1c";
    const baseBooleanDark = "#34d399";
    const baseNumberDark = "#38bdf8";
    const baseNullDark = "#fca5a5";

    return {
      rootFontSize: 11,
      styles: {
        container: {
          backgroundColor: "transparent",
          color: "var(--fg)",
          fontFamily:
            'var(--font-mono, "JetBrains Mono", "Fira Code", "IBM Plex Mono", "ui-monospace", monospace)',
        },
        collection: { backgroundColor: "transparent" },
        collectionInner: { backgroundColor: "transparent" },
        collectionElement: { borderRadius: "6px", paddingBlock: "2px" },
        property: { color: "var(--muted)" },
        bracket: {
          color: isDark
            ? "rgba(226, 232, 240, 0.85)"
            : "rgba(17, 24, 39, 0.75)",
          fontWeight: 600,
        },
        itemCount: { color: "var(--muted)", fontStyle: "italic" },
        string: "var(--accent)",
        number: isDark ? baseNumberDark : baseNumber,
        boolean: isDark ? baseBooleanDark : baseBoolean,
        null: isDark ? baseNullDark : baseNull,
        input: [
          "var(--fg)",
          {
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.7)"
              : "rgba(255, 255, 255, 0.95)",
            border: isDark
              ? "1px solid rgba(148, 163, 184, 0.35)"
              : "1px solid rgba(148, 163, 184, 0.45)",
            borderRadius: "6px",
            padding: "2px 4px",
          },
        ],
        inputHighlight: isDark
          ? "rgba(59, 130, 246, 0.35)"
          : "rgba(59, 130, 246, 0.2)",
        error: {
          color: isDark ? "#f87171" : "#b91c1c",
          fontWeight: 600,
        },
      },
    };
  }, [isDark]);

  const noteMeta = useMemo(() => buildNoteNodeMetadata(draft), [draft]);

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

  const icons = useMemo(() => {
    const base = {
      size: 18,
      style: { verticalAlign: "middle" },
    };

    const accent = { color: "var(--accent)" };
    const muted = { color: "var(--muted)" };
    const danger = { color: isDark ? "#f87171" : "#dc2626" };

    return {
      add: <FiPlus {...base} style={{ ...base.style, ...accent }} />,
      edit: <FiEdit2 {...base} style={{ ...base.style, ...accent }} />,
      delete: <FiTrash2 {...base} style={{ ...base.style, ...danger }} />,
      copy: <FiClipboard {...base} style={{ ...base.style, ...accent }} />,
      ok: <FiCheck {...base} style={{ ...base.style, ...accent }} />,
      cancel: <FiX {...base} style={{ ...base.style, ...muted }} />,
      chevron: <FiChevronRight {...base} style={{ ...base.style, ...muted }} />,
    };
  }, [isDark]);

  const { height: winH } = useWindowSize();
  const editorMaxH = Math.max(240, winH - 280);

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
        <div className="tv-modal__status" role="status" aria-live="polite">
          {pointer ? <span>Focused: {pointer}</span> : <span>&nbsp;</span>}
          {error ? <span className="tv-modal__error">{error}</span> : null}
        </div>
      </div>
      <footer className="tv-modal__footer">
        <button type="button" className="tv-button" onClick={handleCancel}>
          Cancel
        </button>
        <button type="button" className="tv-button" onClick={handleSave}>
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

const TuningPackEditorModalMemo = memoWithPick(TuningPackEditorModal, pick);

export default TuningPackEditorModalMemo;
