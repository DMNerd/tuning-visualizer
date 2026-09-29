import { createElement } from "react";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@shared/ui/ConfirmDialog";
import i18n from "@shared/i18n";

export function confirm({
  title = i18n.t("resets.resetAllTitle"),
  message = i18n.t("resets.resetAllMessage"),
  confirmText = i18n.t("resets.resetAllConfirm"),
  cancelText = i18n.t("common.cancel"),
  toastId = "confirm-reset",
  duration = Infinity,
} = {}) {
  return new Promise((resolve) => {
    toast.dismiss(toastId);
    let isSettled = false;

    const settle = (value) => {
      if (isSettled) return;
      isSettled = true;
      resolve(value);
    };

    toast(
      (t) =>
        createElement(ConfirmDialog, {
          title,
          message,
          confirmText,
          cancelText,
          onConfirm: () => {
            settle(true);
            toast.dismiss(t.id);
          },
          onCancel: () => {
            settle(false);
            toast.dismiss(t.id);
          },
          onDismiss: () => {
            settle(false);
          },
        }),
      { id: toastId, duration },
    );
  });
}
