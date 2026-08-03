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
  const confirmButtonRef = useRef(null);

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

  // Respect whichever button is actually focused (Cancel is autoFocus'd as
  // the safe default) rather than always confirming — otherwise Enter/Space
  // bypasses the visible focus state and can trigger a destructive action
  // the user never selected. Falls back to Cancel when neither button has
  // focus, keeping the same safe-by-default behavior autoFocus implies.
  const handleEnterOrSpace = useCallback(
    (event) => {
      if (document.activeElement === confirmButtonRef.current) {
        handleConfirm(event);
        return;
      }
      handleCancel(event);
    },
    [handleCancel, handleConfirm],
  );

  useKey(
    (e) => {
      const k = e.key.toLowerCase();
      return k === "enter" || k === " ";
    },
    handleEnterOrSpace,
    undefined,
    [handleEnterOrSpace],
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
          ref={confirmButtonRef}
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
