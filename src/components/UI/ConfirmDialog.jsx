import React from "react";

export default function ConfirmDialog({
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="confirm-toast"
    >
      <div id="confirm-title" className="confirm-toast__title">
        {title}
      </div>

      {message ? <div className="confirm-toast__message">{message}</div> : null}

      <div className="confirm-toast__actions">
        <button
          type="button"
          onClick={onCancel}
          autoFocus
          className="confirm-toast__button confirm-toast__button--cancel"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="confirm-toast__button confirm-toast__button--confirm"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
