import { isHotkey } from "is-hotkey";
import { isTypingTarget, toHotkeyCombo } from "@/hooks/hotkeyUtils";

function isDialogInteractionTarget(target) {
  if (!target || typeof target.closest !== "function") return false;
  return Boolean(target.closest("[role='dialog'], .tv-modal"));
}

export const createShortcutHandler = (shortcuts, options = {}) => (event) => {
  const { enabled = true } = options;
  if (!enabled) return;
  if (isTypingTarget(event.target)) return;
  if (isDialogInteractionTarget(event.target)) return;

  for (const shortcut of shortcuts) {
    if (!shortcut?.combo || typeof shortcut.handler !== "function") continue;
    if (typeof shortcut.when === "function" && !shortcut.when()) continue;

    const combos = Array.isArray(shortcut.combo)
      ? shortcut.combo
      : [shortcut.combo];
    if (combos.some((combo) => isHotkey(toHotkeyCombo(combo), event))) {
      event.preventDefault();
      shortcut.handler(event);
      return;
    }
  }
};
