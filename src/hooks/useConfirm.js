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
    duration = Infinity,
  } = {}) {
    return new Promise((resolve) => {
      toast.dismiss(toastId);
      let isSettled = false;
      let unsubscribe;

      const cleanup = () => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
          unsubscribe = undefined;
        }
      };

      const settle = (value) => {
        if (isSettled) return;
        isSettled = true;
        cleanup();
        resolve(value);
      };

      unsubscribe = toast.onChange((toastEvent) => {
        if (toastEvent.id === toastId && toastEvent.status === "removed") {
          settle(false);
        }
      });

      toast(
        (t) =>
          React.createElement(ConfirmDialog, {
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
          }),
        { id: toastId, duration },
      );
    });
  }

  return { confirm };
}
