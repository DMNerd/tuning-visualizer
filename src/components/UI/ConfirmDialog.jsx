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
      style={{
        display: "grid",
        gap: 10,
        maxWidth: 360,
        padding: "6px 4px 2px",
      }}
    >
      <div
        id="confirm-title"
        style={{
          fontWeight: 600,
          fontSize: "0.875rem",
          color: "var(--fg)",
        }}
      >
        {title}
      </div>

      {message ? (
        <div
          style={{
            color: "var(--muted)",
            fontSize: "0.8125rem",
            lineHeight: 1.4,
          }}
        >
          {message}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 6,
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          autoFocus
          style={{
            flex: 1,
            border: "1px solid var(--line)",
            borderRadius: 8,
            background: "transparent",
            color: "var(--muted)",
            padding: "6px 10px",
            fontSize: "0.8125rem",
            cursor: "pointer",
            transition: "background var(--speed) var(--ease)",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background =
              "color-mix(in oklab, var(--fg) 8%, transparent)")
          }
          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          style={{
            flex: 1,
            border: "1px solid var(--line)",
            borderRadius: 8,
            background: "color-mix(in oklab, var(--root) 18%, transparent)",
            color: "var(--fg)",
            padding: "6px 10px",
            fontSize: "0.8125rem",
            cursor: "pointer",
            transition: "background var(--speed) var(--ease)",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background =
              "color-mix(in oklab, var(--root) 26%, transparent)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background =
              "color-mix(in oklab, var(--root) 18%, transparent)")
          }
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
