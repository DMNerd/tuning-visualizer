import { useEffect, useCallback } from "react";
import { useKey } from "react-use";

export default function ConfirmDialog({
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  onDismiss,
}) {
  useEffect(
    () => () => {
      if (typeof onDismiss === "function") {
        onDismiss();
      }
    },
    [onDismiss],
  );

  const handleCancel = useCallback(
    (event) => {
      event.preventDefault();
      if (typeof onCancel === "function") {
        onCancel();
      }
    },
    [onCancel],
  );

  const handleConfirm = useCallback(
    (event) => {
      event.preventDefault();
      if (typeof onConfirm === "function") {
        onConfirm();
      }
    },
    [onConfirm],
  );

  useKey((e) => e.key.toLowerCase() === "escape", handleCancel, undefined, [
    handleCancel,
  ]);

  useKey(
    (e) => {
      const k = e.key.toLowerCase();
      return k === "enter" || k === " ";
    },
    handleConfirm,
    undefined,
    [handleConfirm],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="tv-overlay"
    >
      <div id="confirm-title" className="tv-overlay__title">
        {title}
      </div>

      {message ? <div className="tv-overlay__message">{message}</div> : null}

      <div className="tv-overlay__actions">
        <button
          type="button"
          onClick={onCancel}
          autoFocus
          className="tv-overlay__button tv-overlay__button--muted"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="tv-overlay__button tv-overlay__button--accent"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
