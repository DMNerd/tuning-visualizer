import React from "react";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/components/UI/ConfirmDialog";

export function useConfirm() {
  function confirm({
    title = "Reset all settings?",
    message = "This will reset instrument, display, scale & root, and chord overlay.",
    confirmText = "Reset all",
    cancelText = "Cancel",
    toastId = "confirm-reset",
    duration = 10000,
  } = {}) {
    return new Promise((resolve) => {
      toast.dismiss(toastId);
      toast(
        (t) =>
          React.createElement(ConfirmDialog, {
            title,
            message,
            confirmText,
            cancelText,
            onConfirm: () => {
              toast.dismiss(t.id);
              resolve(true);
            },
            onCancel: () => {
              toast.dismiss(t.id);
              resolve(false);
            },
          }),
        { id: toastId, duration },
      );
    });
  }

  return { confirm };
}
