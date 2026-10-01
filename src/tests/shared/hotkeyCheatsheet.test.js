import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CHEATSHEET_ROWS, formatCombo } from "@shared/hooks/hotkeyCheatsheet";
import { buildShortcutTableFromRefs } from "@shared/hooks/hotkeysTable";

const en = JSON.parse(
  readFileSync(
    join(import.meta.dirname, "../../shared/i18n/locales/en.json"),
    "utf-8",
  ),
);

// Rows in the cheatsheet's "a / b • c" notation.
const asText = ({ alts }) =>
  alts
    .map((combos) => combos.map((parts) => parts.join("+")).join(" / "))
    .join(" • ");

test("formatCombo labels modifiers and named keys", () => {
  assert.deepEqual(formatCombo("f"), ["f"]);
  assert.deepEqual(formatCombo("ctrl+n"), ["Ctrl", "N"]);
  assert.deepEqual(formatCombo("meta+d"), ["Cmd", "D"]);
  assert.deepEqual(formatCombo("shift+/"), ["Shift", "/"]);
  assert.deepEqual(formatCombo("arrowdown"), ["ArrowDown"]);
  assert.deepEqual(formatCombo("F1"), ["F1"]);
});

test("cheatsheet rows are built from the hotkey table", () => {
  const rows = Object.fromEntries(
    CHEATSHEET_ROWS.map((row) => [row.descKey, asText(row)]),
  );
  assert.deepEqual(rows, {
    "hotkeys.help": "Shift+/ • Ctrl+/ • F1",
    "hotkeys.fullscreen": "f",
    "hotkeys.cycleLabels": "l",
    "hotkeys.openNotes": "o",
    "hotkeys.fretNumbers": "n",
    "hotkeys.colorByDegree": "d",
    "hotkeys.accidentals": "a",
    "hotkeys.lefty": "g",
    "hotkeys.dotSize": ", / .",
    "hotkeys.chordOverlay": "c",
    "hotkeys.hideNonChord": "h",
    "hotkeys.strings": "[ / ]",
    "hotkeys.frets": "- / =",
    "hotkeys.randomize": "r",
    "hotkeys.metronome": "m • Space",
    "hotkeys.bpm": "Alt+[ / Alt+] • ArrowDown / ArrowUp",
    "hotkeys.tapTempo": "t • Enter",
    "hotkeys.newPack": "Ctrl+N • Cmd+N",
    "hotkeys.favorite": "Ctrl+D • Cmd+D",
  });
});

test("every hotkey has a cheatsheet description in en.json", () => {
  for (const { combo, descKey } of buildShortcutTableFromRefs({
    current: {},
  })) {
    assert.ok(descKey, `no descKey for ${combo}`);
    const [ns, key] = descKey.split(".");
    assert.equal(typeof en[ns]?.[key], "string", `missing ${descKey}`);
  }
});
