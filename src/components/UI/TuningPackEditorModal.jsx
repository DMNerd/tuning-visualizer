import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ClickableJson } from "clickable-json";
import { applyPatch } from "json-joy/esm/json-patch/applyPatch";
import * as v from "valibot";
import { Provider as NanoThemeProvider } from "nano-theme";
import { useKey, useLockBodyScroll } from "react-use";
import { TuningPackSchema } from "@/hooks/useTuningIO";

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

  const handlePatch = useCallback(
    (patch) => {
      setDraft((prev) => {
        try {
          const current = prev ?? {};
          const result = applyPatch(current, patch, { mutate: false });
          setError("");
          return result.doc;
        } catch (e) {
          setError(e?.message || "Unable to update pack.");
          return prev;
        }
      });
    },
    [setError],
  );

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

  const resolvedTheme = themeMode === "dark" ? "dark" : "light";

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
            <NanoThemeProvider theme={resolvedTheme}>
              <ClickableJson
                doc={draft}
                onChange={handlePatch}
                onFocus={setPointer}
                fontSize="13px"
              />
            </NanoThemeProvider>
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
