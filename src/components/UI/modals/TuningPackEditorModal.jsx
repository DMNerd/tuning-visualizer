import { useCallback, useEffect, useMemo, useState, useId } from "react";
import { JsonEditor } from "json-edit-react";
import {
  useDebounce,
  useKey,
  useLatest,
  useToggle,
  useWindowSize,
} from "react-use";
import { parseTuningPack } from "@/lib/export/schema";
import { useConfirm } from "@/hooks/useConfirm";
import { toast } from "react-hot-toast";
import { memoWithShallowPick } from "@/utils/memo";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiClipboard,
  FiCheck,
  FiX,
  FiChevronRight,
  FiAlertTriangle,
  FiRefreshCcw,
} from "react-icons/fi";
import ModalFrame from "@/components/UI/modals/ModalFrame";
import { STR_MAX, STR_MIN } from "@/lib/config/appDefaults";
import { SPELLING_MARKER_DISPLAY } from "@/lib/theory/notation";
import {
  buildNoteOptionsForPack,
  ensurePack,
  buildTemplatePack,
  togglePackSpelling,
} from "@/components/UI/modals/tuningPackNormalization";

function clonePack(pack) {
  if (!pack) return null;
  if (typeof structuredClone === "function") {
    return structuredClone(pack);
  }
  return JSON.parse(JSON.stringify(pack));
}

function getSeedSnapshot(pack, mode) {
  const source = clonePack(pack);
  return mode === "create" ? buildTemplatePack(source) : ensurePack(source);
}

function pushUnique(list, seen, value) {
  if (typeof value !== "string") return;
  const normalized = value.trim();
  if (!normalized.length || seen.has(normalized)) return;
  seen.add(normalized);
  list.push(normalized);
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

  const { confirm } = useConfirm();

  const onCancelRef = useLatest(onCancel);
  const onSubmitRef = useLatest(onSubmit);
  const confirmRef = useLatest(confirm);

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
      reset: <FiRefreshCcw {...base} style={{ ...base.style, ...accent }} />,
    };
  }, [isDark]);

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

  const exampleSnippet = useMemo(
    () =>
      JSON.stringify(
        {
          name: "Custom pack example",
          spelling: "german",
          system: { edo: 12 },
          tuning: {
            strings: [
              { label: "String 1", note: "E" },
              { label: "String 2", note: "Hih" },
              { label: "String 3", midi: 55 },
              { label: "String 4", note: "Aeh" },
            ],
          },
          meta: {
            stringMeta: [{ index: 0, startFret: 2, greyBefore: true }],
            board: { fretStyle: "dotted", notePlacement: "onFret" },
          },
        },
        null,
        2,
      ),
    [],
  );

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
          <div className="tv-pack-helper__toggle-row">
            <button
              type="button"
              className="tv-pack-helper__toggle"
              onClick={handleToggleHelper}
              aria-expanded={!isHelperCollapsed}
              aria-controls="pack-helper-content"
              aria-label={`${
                isHelperCollapsed ? "Show" : "Hide"
              } pack helper details`}
            >
              <span
                className={`tv-pack-helper__chevron${
                  isHelperCollapsed ? " is-rotated" : ""
                }`}
                aria-hidden
              >
                {icons.chevron}
              </span>
              <span className="tv-pack-helper__toggle-label">
                {isHelperCollapsed ? "Show helper" : "Hide helper"}
              </span>
            </button>
          </div>
          <aside
            id="pack-helper-content"
            className={`tv-pack-helper${isHelperCollapsed ? " is-hidden" : ""}`}
            tabIndex={isHelperCollapsed ? -1 : 0}
            aria-label="Tuning pack requirements and quick actions"
            aria-expanded={!isHelperCollapsed}
            aria-hidden={isHelperCollapsed}
          >
            <div className="tv-pack-helper__header">
              <div className="tv-pack-helper__header-text">
                <h3>Pack requirements</h3>
                <p>
                  Ensure your pack stays valid while you edit. Keep these rules
                  in mind:
                </p>
              </div>
            </div>
            <div className="tv-pack-helper__content">
              <ul className="tv-pack-helper__list">
                <li>
                  <strong>Name:</strong> required text label.
                </li>
                <li>
                  <strong>system.edo:</strong> integer {"\u2265"} 12.
                </li>
                <li>
                  <strong>Strings:</strong> between {STR_MIN} and {STR_MAX}{" "}
                  entries.
                </li>
                <li>
                  <strong>Each string:</strong> include a <code>note</code> or{" "}
                  <code>midi</code> value (labels optional).
                </li>
                <li>
                  <strong>spelling</strong> (optional): set to{" "}
                  {SPELLING_MARKER_DISPLAY.map((marker, idx) => (
                    <span key={marker}>
                      {idx > 0 ? ", " : ""}
                      <code>"{marker}"</code>
                    </span>
                  ))}{" "}
                  to auto-translate notes to international spellings for
                  internal logic (for example <code>Hih</code> → <code>B↑</code>
                  , <code>Aeh</code> → <code>A↓</code>). Arrow forms are
                  accepted too.
                </li>
              </ul>
              <div className="tv-pack-helper__meta">
                <div className="tv-pack-helper__meta-section">
                  <div className="tv-pack-helper__meta-title">String meta</div>
                  <p className="tv-pack-helper__meta-copy">
                    Optional <code>meta.stringMeta</code> entries let you set
                    per-string visuals.
                  </p>
                  <ul className="tv-pack-helper__meta-list">
                    <li>
                      <code>index</code>: the string number to target
                      (required).
                    </li>
                    <li>
                      <code>startFret</code>: first fret to render (default 0).
                    </li>
                    <li>
                      <code>greyBefore</code>: hide frets before start (default
                      true).
                    </li>
                  </ul>
                </div>
                <div className="tv-pack-helper__meta-section">
                  <div className="tv-pack-helper__meta-title">Board meta</div>
                  <p className="tv-pack-helper__meta-copy">
                    Configure <code>meta.board</code> to control fretboard
                    defaults.
                  </p>
                  <ul className="tv-pack-helper__meta-list">
                    <li>
                      <code>fretStyle</code>: <code>"solid"</code> or{" "}
                      <code>"dotted"</code>.
                    </li>
                    <li>
                      <code>notePlacement</code>: <code>"between"</code> or{" "}
                      <code>"onFret"</code>.
                    </li>
                    <li>
                      <code>hiddenFrets</code>: array of 0-based rendered fret
                      indices to hide (N-TET safe). Example:{" "}
                      <code>[0, 1, 13]</code>.
                    </li>
                    <li>
                      Pattern/modulo shorthand is not supported here; repeat
                      indices per octave manually when needed.
                    </li>
                  </ul>
                </div>
              </div>
              <div
                className="tv-pack-helper__actions"
                role="group"
                aria-label="Pack shortcuts"
              >
                <button
                  type="button"
                  className="tv-button tv-button--ghost"
                  onClick={handleInsertString}
                >
                  {icons.add} Add string
                </button>
                <button
                  type="button"
                  className="tv-button tv-button--ghost"
                  onClick={handleResetTemplate}
                >
                  {icons.reset} Reload template
                </button>
                <button
                  type="button"
                  className="tv-button tv-button--ghost"
                  onClick={handleToggleSpellingHint}
                >
                  {hasSpellingHint ? icons.cancel : icons.ok}{" "}
                  {hasSpellingHint
                    ? "Remove spelling hint"
                    : 'Set spelling: "de-h/b"'}
                </button>
              </div>
              <div className="tv-pack-helper__example">
                <div className="tv-pack-helper__example-header">
                  Example snippet
                </div>
                <pre>
                  <code>{exampleSnippet}</code>
                </pre>
              </div>
            </div>
          </aside>
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
