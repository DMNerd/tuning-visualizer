import test from "node:test";
import assert from "node:assert/strict";

import { isHotkey } from "is-hotkey";

import { toHotkeyCombo } from "@/hooks/hotkeyUtils";
import { createShortcutHandler } from "@/hooks/hotkeyHandler";
import { buildShortcutTableFromRefs } from "@/hooks/hotkeysTable";

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

test("shortcut handler fires in normal app context", () => {
  let callCount = 0;
  let prevented = false;
  const handler = createShortcutHandler([
    {
      combo: "f",
      handler: () => {
        callCount += 1;
      },
    },
  ]);

  handler({
    ...makeKeyboardEvent({ key: "f" }),
    target: { closest: () => null },
    preventDefault: () => {
      prevented = true;
    },
  });

  assert.equal(callCount, 1);
  assert.equal(prevented, true);
});

test("shortcut handler ignores events from dialog/modal targets", () => {
  let callCount = 0;
  let prevented = false;
  const handler = createShortcutHandler([
    {
      combo: "f",
      handler: () => {
        callCount += 1;
      },
    },
  ]);

  handler({
    ...makeKeyboardEvent({ key: "f" }),
    target: {
      closest: (selector) =>
        selector === "[role='dialog'], .tv-modal" ? {} : null,
    },
    preventDefault: () => {
      prevented = true;
    },
  });

  assert.equal(callCount, 0);
  assert.equal(prevented, false);
});

test("shortcut handler can be globally disabled via enabled=false", () => {
  let callCount = 0;
  let prevented = false;
  const handler = createShortcutHandler(
    [
      {
        combo: "f",
        handler: () => {
          callCount += 1;
        },
      },
    ],
    { enabled: false },
  );

  handler({
    ...makeKeyboardEvent({ key: "f" }),
    target: { closest: () => null },
    preventDefault: () => {
      prevented = true;
    },
  });

  assert.equal(callCount, 0);
  assert.equal(prevented, false);
});

test("hotkey table uses latest strings/frets and callbacks via refs", () => {
  const calls = [];
  const liveRef = {
    current: {
      toggleFs: null,
      setDisplayPrefs: null,
      setFrets: (next) => calls.push(["frets", next]),
      handleStringsChange: (next) => calls.push(["strings", next]),
      setShowChord: null,
      setHideNonChord: null,
      strings: 6,
      frets: 24,
      onShowCheatsheet: null,
      minStrings: 4,
      maxStrings: 8,
      minFrets: 12,
      maxFrets: 30,
      minDot: 8,
      maxDot: 24,
      labelValues: [],
      onRandomizeScale: null,
      onCreateCustomPack: null,
      practiceActions: null,
      enabled: true,
    },
  };

  const shortcuts = buildShortcutTableFromRefs(liveRef);
  const handler = createShortcutHandler(shortcuts, { enabled: true });
  const fretsDownShortcut = shortcuts.find((entry) => entry.combo === "-");
  assert.ok(fretsDownShortcut);

  handler({
    ...makeKeyboardEvent({ key: "]" }),
    target: { closest: () => null },
    preventDefault: () => {},
  });
  fretsDownShortcut.handler();

  liveRef.current.strings = 7;
  liveRef.current.frets = 25;

  handler({
    ...makeKeyboardEvent({ key: "]" }),
    target: { closest: () => null },
    preventDefault: () => {},
  });
  fretsDownShortcut.handler();

  assert.deepEqual(calls, [
    ["strings", 7],
    ["frets", 23],
    ["strings", 8],
    ["frets", 24],
  ]);
});

test("hotkey table preserves modal gating and supports updated practice actions via refs", () => {
  let initialToggleCalls = 0;
  let latestToggleCalls = 0;
  const liveRef = {
    current: {
      toggleFs: null,
      setDisplayPrefs: null,
      setFrets: null,
      handleStringsChange: null,
      setShowChord: null,
      setHideNonChord: null,
      strings: 6,
      frets: 24,
      onShowCheatsheet: null,
      minStrings: 4,
      maxStrings: 8,
      minFrets: 12,
      maxFrets: 30,
      minDot: 8,
      maxDot: 24,
      labelValues: [],
      onRandomizeScale: null,
      onCreateCustomPack: null,
      practiceActions: {
        toggleMetronome: () => {
          initialToggleCalls += 1;
        },
      },
      enabled: true,
    },
  };

  const shortcuts = buildShortcutTableFromRefs(liveRef);
  const handler = createShortcutHandler(shortcuts, { enabled: true });

  handler({
    ...makeKeyboardEvent({ key: "m" }),
    target: {
      closest: (selector) =>
        selector === "[role='dialog'], .tv-modal" ? {} : null,
    },
    preventDefault: () => {},
  });
  assert.equal(initialToggleCalls, 0);

  liveRef.current.practiceActions = {
    toggleMetronome: () => {
      latestToggleCalls += 1;
    },
  };
  handler({
    ...makeKeyboardEvent({ key: "m" }),
    target: { closest: () => null },
    preventDefault: () => {},
  });

  assert.equal(initialToggleCalls, 0);
  assert.equal(latestToggleCalls, 1);
});
