import { useEffect, useCallback, useRef } from "react";
import { useKey } from "react-use";
import { useTranslation } from "react-i18next";

export default function ConfirmDialog({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  onDismiss,
}) {
  const { t } = useTranslation();
  const skipFirstCleanupRef = useRef(true);
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(
    () => () => {
      if (skipFirstCleanupRef.current) {
        skipFirstCleanupRef.current = false;
        return;
      }

      if (typeof dismissRef.current === "function") {
        dismissRef.current();
      }
    },
    [],
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleConfirm = useCallback(() => {
    onConfirm?.();
  }, [onConfirm]);

  useKey((e) => e.key.toLowerCase() === "escape", handleCancel, undefined, [
    handleCancel,
  ]);

  // No JS handling for Enter/Space: Cancel is autoFocus'd as the safe
  // default, and a native <button> already activates (fires click) on
  // Enter/Space when it has focus — respecting whichever button the user
  // actually tabbed to, for free, instead of reimplementing that dispatch
  // imperatively via document.activeElement.

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="tv-overlay"
    >
      <div id="confirm-title" className="tv-overlay__title">
        {title ?? t("common.areYouSure")}
      </div>

      {message ? <div className="tv-overlay__message">{message}</div> : null}

      <div className="tv-overlay__actions">
        <button
          type="button"
          onClick={handleCancel}
          autoFocus
          className="tv-overlay__button tv-overlay__button--muted"
        >
          {cancelText ?? t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="tv-overlay__button tv-overlay__button--accent"
        >
          {confirmText ?? t("common.confirm")}
        </button>
      </div>
    </div>
  );
}
