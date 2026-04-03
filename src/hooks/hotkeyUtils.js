const KEY_CODE_ALIASES = {
  "/": "slash",
  "[": "bracketleft",
  "]": "bracketright",
  "-": "minus",
  "=": "equal",
  ",": "comma",
  ".": "period",
};

export const isTypingTarget = (el) => {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  const editable = el.getAttribute?.("contenteditable") === "true";
  return editable || tag === "input" || tag === "textarea" || tag === "select";
};

export const normalizeComboKey = (key) => {
  if (!key) return "";
  const lower = key.toLowerCase();
  if (lower === "space" || lower === "spacebar") return "space";
  if (lower === "enter" || lower === "return") return "enter";
  if (lower === "escape" || lower === "esc") return "escape";
  return lower;
};

const normalizeEventKey = (key) => {
  if (!key) return "";
  const lower = key.toLowerCase();
  if (lower === " ") return "space";
  if (lower === "spacebar") return "space";
  if (lower === "esc") return "escape";
  return lower;
};

export const parseCombo = (combo) => {
  if (typeof combo !== "string") return null;
  const parts = combo
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  const modifiers = {
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  };
  let keyPart = "";

  parts.forEach((part) => {
    const lower = part.toLowerCase();
    if (lower === "ctrl" || lower === "control" || lower === "cmdorctrl") {
      modifiers.ctrlKey = true;
    } else if (lower === "meta" || lower === "cmd" || lower === "command") {
      modifiers.metaKey = true;
    } else if (lower === "alt" || lower === "option") {
      modifiers.altKey = true;
    } else if (lower === "shift") {
      modifiers.shiftKey = true;
    } else {
      keyPart = part;
    }
  });

  if (!keyPart && parts.length) {
    keyPart = parts[parts.length - 1];
  }

  return { keyPart, modifiers };
};

const matchesModifiers = (expected, event) =>
  event.altKey === expected.altKey &&
  event.ctrlKey === expected.ctrlKey &&
  event.metaKey === expected.metaKey &&
  event.shiftKey === expected.shiftKey;

const matchesKey = (keyPart, event) => {
  if (!keyPart) return false;
  const normalizedPart = normalizeComboKey(keyPart);
  const eventKey = normalizeEventKey(event.key);

  if (normalizedPart === eventKey) return true;
  if (normalizedPart === "space" && eventKey === "space") return true;
  if (normalizedPart === "/" && (eventKey === "/" || eventKey === "?"))
    return true;

  const code = KEY_CODE_ALIASES[normalizedPart];
  if (code && event.code?.toLowerCase() === code) {
    return true;
  }

  return false;
};

export const matchesCombo = (combo, event) => {
  const parsed = parseCombo(combo);
  if (!parsed) return false;
  if (!matchesModifiers(parsed.modifiers, event)) return false;
  return matchesKey(parsed.keyPart, event);
};
