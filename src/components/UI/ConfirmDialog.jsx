import { useEffect, useCallback, useRef } from "react";
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
  const skipFirstCleanup = useRef(true);
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(
    () => () => {
      if (skipFirstCleanup.current) {
        skipFirstCleanup.current = false;
        return;
      }

      if (typeof dismissRef.current === "function") {
        dismissRef.current();
      }
    },
    [],
  );

  const handleCancel = useCallback(
    (event) => {
      event?.preventDefault?.();
      if (typeof onCancel === "function") {
        onCancel();
      }
    },
    [onCancel],
  );

  const handleConfirm = useCallback(
    (event) => {
      event?.preventDefault?.();
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
          onClick={handleCancel}
          autoFocus
          className="tv-overlay__button tv-overlay__button--muted"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="tv-overlay__button tv-overlay__button--accent"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
