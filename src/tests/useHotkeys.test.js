import test from "node:test";
import assert from "node:assert/strict";

import { isHotkey } from "is-hotkey";

import { toHotkeyCombo } from "@/hooks/hotkeyUtils";

const KEY_CODES = {
  " ": 32,
  Enter: 13,
  ArrowDown: 40,
  ArrowUp: 38,
  F1: 112,
  "[": 219,
  "]": 221,
  "/": 191,
  "?": 191,
};

const makeKeyboardEvent = ({
  key,
  altKey = false,
  ctrlKey = false,
  metaKey = false,
  shiftKey = false,
}) => {
  const keyCode =
    KEY_CODES[key] ?? (key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0);

  return {
    key,
    altKey,
    ctrlKey,
    metaKey,
    shiftKey,
    keyCode,
    which: keyCode,
  };
};

test("toHotkeyCombo normalizes combo aliases to is-hotkey syntax", () => {
  assert.equal(toHotkeyCombo("meta+N"), "meta+n");
  assert.equal(toHotkeyCombo("shift+/"), "shift+/");
  assert.equal(toHotkeyCombo("spacebar"), "space");
  assert.equal(toHotkeyCombo("alt+["), "alt+[");
  assert.equal(toHotkeyCombo("cmdorctrl+n"), "mod+n");
});

test("is-hotkey matcher is compatible with existing shortcut combos", () => {
  const cases = [
    ["ctrl+n", makeKeyboardEvent({ key: "n", ctrlKey: true })],
    ["meta+n", makeKeyboardEvent({ key: "n", metaKey: true })],
    ["shift+/", makeKeyboardEvent({ key: "?", shiftKey: true })],
    ["space", makeKeyboardEvent({ key: " " })],
    ["alt+[", makeKeyboardEvent({ key: "[", altKey: true })],
    ["alt+]", makeKeyboardEvent({ key: "]", altKey: true })],
    ["arrowdown", makeKeyboardEvent({ key: "ArrowDown" })],
    ["arrowup", makeKeyboardEvent({ key: "ArrowUp" })],
    ["enter", makeKeyboardEvent({ key: "Enter" })],
    ["f1", makeKeyboardEvent({ key: "F1" })],
  ];

  for (const [combo, event] of cases) {
    assert.equal(isHotkey(toHotkeyCombo(combo), event), true, combo);
  }
});
