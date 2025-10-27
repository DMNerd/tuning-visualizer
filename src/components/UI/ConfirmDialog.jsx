import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";

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

  useHotkeys(
    "escape",
    (event) => {
      event.preventDefault();
      if (typeof onCancel === "function") {
        onCancel();
      }
    },
    {
      preventDefault: true,
    },
    [onCancel],
  );

  useHotkeys(
    ["enter", "space"],
    (event) => {
      event.preventDefault();
      if (typeof onConfirm === "function") {
        onConfirm();
      }
    },
    {
      preventDefault: true,
    },
    [onConfirm],
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
          autoFocus
          className="tv-overlay__button tv-overlay__button--accent"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
