import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { JsonEditor } from "json-edit-react";
import * as v from "valibot";
import { useKey, useLockBodyScroll } from "react-use";
import { TuningPackSchema } from "@/lib/export/schema";

function clonePack(pack) {
  if (!pack) return null;
  if (typeof structuredClone === "function") {
    return structuredClone(pack);
  }
  return JSON.parse(JSON.stringify(pack));
}

function ensurePack(pack) {
  if (pack && typeof pack === "object") return pack;
  return {
    version: 2,
    name: "",
    system: { edo: 12 },
    tuning: { strings: [] },
    meta: {},
  };
}

export default function TuningPackEditorModal({
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

  useEffect(() => {
    if (isOpen) {
      setDraft(ensurePack(clonePack(initialPack)));
      setError("");
      setPointer(null);
    }
  }, [isOpen, initialPack]);

  useLockBodyScroll(isOpen);

  useKey(
    "Escape",
    (event) => {
      if (!isOpen) return;
      event.preventDefault();
      onCancel?.();
    },
    { event: "keydown" },
    [isOpen, onCancel],
  );

  const title = useMemo(
    () =>
      mode === "edit"
        ? `Edit custom pack${originalName ? `: ${originalName}` : ""}`
        : "Create custom pack",
    [mode, originalName],
  );

  const handleDataChange = useCallback((nextData) => {
    setDraft(nextData);
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

  const editorTheme = useMemo(() => {
    const baseBoolean = "#0f766e";
    const baseNumber = "#2563eb";
    const baseNull = "#b91c1c";
    const baseBooleanDark = "#34d399";
    const baseNumberDark = "#38bdf8";
    const baseNullDark = "#fca5a5";
    const isDark = themeMode === "dark";

    return {
      rootFontSize: 11,
      styles: {
        container: {
          backgroundColor: "transparent",
          color: "var(--fg)",
          fontFamily:
            'var(--font-mono, "JetBrains Mono", "Fira Code", "IBM Plex Mono", "ui-monospace", monospace)',
        },
        collection: {
          backgroundColor: "transparent",
        },
        collectionInner: {
          backgroundColor: "transparent",
        },
        collectionElement: {
          borderRadius: "6px",
          paddingBlock: "2px",
        },
        property: {
          color: "var(--muted)",
        },
        bracket: {
          color: isDark
            ? "rgba(226, 232, 240, 0.85)"
            : "rgba(17, 24, 39, 0.75)",
          fontWeight: 600,
        },
        itemCount: {
          color: "var(--muted)",
          fontStyle: "italic",
        },
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
        iconCollection: "var(--muted)",
        iconEdit: "var(--accent)",
        iconDelete: isDark ? "#f87171" : "#dc2626",
        iconAdd: "var(--accent)",
        iconCopy: isDark ? baseNumberDark : baseNumber,
      },
    };
  }, [themeMode]);

  const handleSave = useCallback(() => {
    try {
      const validation = v.safeParse(TuningPackSchema, draft);
      if (!validation.success) {
        const msg =
          validation.issues?.map((i) => i.message).join("; ") ||
          "Invalid pack data.";
        setError(msg);
        return;
      }

      const pack = validation.output;
      const trimmedName = pack.name?.trim?.();
      if (!trimmedName) {
        setError("Please provide a pack name.");
        return;
      }

      const normalized = {
        ...pack,
        name: trimmedName,
      };

      onSubmit?.(normalized, {
        replaceName: mode === "edit" ? originalName : undefined,
      });
    } catch (e) {
      setError(e?.message || "Unable to save pack.");
    }
  }, [draft, mode, onSubmit, originalName]);

  if (!isOpen) return null;

  return createPortal(
    <div className="tv-modal" role="presentation">
      <div className="tv-modal__backdrop" aria-hidden onClick={onCancel} />
      <div
        className="tv-modal__card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="tv-modal__header">
          <h2>{title}</h2>
          <p className="tv-modal__summary">
            Edit the JSON to fine-tune your preset. Changes are applied using
            JSON Patch operations.
          </p>
        </header>
        <div className="tv-modal__body">
          <div className="tv-modal__editor">
            <JsonEditor
              data={draft}
              setData={handleDataChange}
              onError={handleError}
              onEditEvent={handleEditEvent}
              theme={editorTheme}
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
          <button type="button" className="tv-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="tv-button" onClick={handleSave}>
            Save pack
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
