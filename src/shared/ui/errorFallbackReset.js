import i18n from "@shared/i18n";
import { resetAllStores } from "@shared/lib/resetAllStores";

export async function performFactoryReset({
  confirm,
  reset = resetAllStores,
  reload = () => window.location.reload(),
  onSuccess,
  onError,
}) {
  const ok = await confirm({
    title: i18n.t("resets.clearStorageTitle"),
    message: i18n.t("resets.clearStorageMessage"),
    confirmText: i18n.t("resets.clearStorageConfirm"),
    cancelText: i18n.t("common.cancel"),
    toastId: "confirm-clear-storage",
  });

  if (!ok) return false;

  try {
    reset();
    onSuccess?.();
    reload();
    return true;
  } catch {
    onError?.();
    return false;
  }
}
