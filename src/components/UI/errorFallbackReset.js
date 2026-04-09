import { resetAllStores } from "@/stores/resetAllStores";

export async function performFactoryReset({
  confirm,
  reset = resetAllStores,
  reload = () => window.location.reload(),
  onSuccess,
  onError,
}) {
  const ok = await confirm({
    title: "Clear saved settings?",
    message:
      "This will clear saved settings and custom tunings for this app in this browser.",
    confirmText: "Clear saved settings",
    cancelText: "Cancel",
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
