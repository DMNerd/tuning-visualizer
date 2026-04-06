const HOTKEY_ALIASES = {
  command: "meta",
  control: "ctrl",
  return: "enter",
  spacebar: "space",
  cmdorctrl: "mod",
};

export const isTypingTarget = (el) => {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  const editable = el.getAttribute?.("contenteditable") === "true";
  return editable || tag === "input" || tag === "textarea" || tag === "select";
};

export const toHotkeyCombo = (combo) => {
  if (typeof combo !== "string") return "";

  return combo
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .map((part) => HOTKEY_ALIASES[part] ?? part)
    .join("+");
};
