import {
  buildShortcutTableFromRefs,
  FAVORITE_OPTION_HOTKEY,
} from "@shared/hooks/hotkeysTable";

const KEY_LABELS = {
  shift: "Shift",
  ctrl: "Ctrl",
  meta: "Cmd",
  alt: "Alt",
  space: "Space",
  enter: "Enter",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
};

const toComboList = (combo) => (Array.isArray(combo) ? combo : [combo]);

// "ctrl+n" -> ["Ctrl", "N"]; a bare letter stays lowercase ("f" -> ["f"]).
export function formatCombo(combo) {
  const parts = String(combo).split("+");
  const hasModifier = parts.length > 1;
  return parts.map((part) => {
    const lower = part.toLowerCase();
    if (KEY_LABELS[lower]) return KEY_LABELS[lower];
    if (part.length === 1) return hasModifier ? part.toUpperCase() : part;
    return part[0].toUpperCase() + part.slice(1);
  });
}

// One row per descKey, in table order. Each row's `alts` are the alternative
// bindings; each alt is a list of formatted combos, two for a "down / up"
// pair made of shortcuts sharing the descKey.
export function buildCheatsheetRows(shortcuts) {
  const groups = new Map();
  for (const shortcut of shortcuts) {
    if (!shortcut?.descKey) continue;
    if (!groups.has(shortcut.descKey)) groups.set(shortcut.descKey, []);
    groups.get(shortcut.descKey).push(toComboList(shortcut.combo));
  }
  return [...groups].map(([descKey, comboLists]) => {
    const altCount = Math.max(...comboLists.map((list) => list.length));
    const alts = Array.from({ length: altCount }, (_, i) =>
      comboLists
        .map((list) => list[i])
        .filter(Boolean)
        .map(formatCombo),
    );
    return { descKey, alts };
  });
}

// Only combos and descKeys are read, so the table needs no live state.
export const CHEATSHEET_ROWS = buildCheatsheetRows([
  ...buildShortcutTableFromRefs({ current: {} }),
  FAVORITE_OPTION_HOTKEY,
]);
