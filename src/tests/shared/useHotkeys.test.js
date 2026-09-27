import test from "node:test";
import assert from "node:assert/strict";

import { isHotkey } from "is-hotkey";

import { toHotkeyCombo } from "@shared/hooks/hotkeyUtils";
import { createShortcutHandler } from "@shared/hooks/hotkeyHandler";
import { buildShortcutTableFromRefs } from "@shared/hooks/hotkeysTable";

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

const APP_TARGET = { closest: () => null };
const MODAL_TARGET = {
  closest: (selector) =>
    selector === "[role='dialog'], .tv-modal" ? {} : null,
};

// Dispatches a keydown for `key` from `target`; returns whether it was
// preventDefault-ed.
function fireKey(handler, key, target = APP_TARGET) {
  let prevented = false;
  handler({
    ...makeKeyboardEvent({ key }),
    target,
    preventDefault: () => {
      prevented = true;
    },
  });
  return prevented;
}

// A single "f" shortcut plus a live read of how often it fired.
function countingShortcuts() {
  const counter = { calls: 0 };
  const shortcuts = [
    {
      combo: "f",
      handler: () => {
        counter.calls += 1;
      },
    },
  ];
  return { counter, shortcuts };
}

function makeLiveRef(overrides = {}) {
  return {
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
      practiceActions: null,
      enabled: true,
      ...overrides,
    },
  };
}

test("shortcut handler fires in normal app context", () => {
  const { counter, shortcuts } = countingShortcuts();
  const prevented = fireKey(createShortcutHandler(shortcuts), "f");

  assert.equal(counter.calls, 1);
  assert.equal(prevented, true);
});

test("shortcut handler ignores events from dialog/modal targets", () => {
  const { counter, shortcuts } = countingShortcuts();
  const prevented = fireKey(
    createShortcutHandler(shortcuts),
    "f",
    MODAL_TARGET,
  );

  assert.equal(counter.calls, 0);
  assert.equal(prevented, false);
});

test("shortcut handler can be globally disabled via enabled=false", () => {
  const { counter, shortcuts } = countingShortcuts();
  const handler = createShortcutHandler(shortcuts, { enabled: false });
  const prevented = fireKey(handler, "f");

  assert.equal(counter.calls, 0);
  assert.equal(prevented, false);
});

test("hotkey table uses latest strings/frets and callbacks via refs", () => {
  const calls = [];
  const liveRef = makeLiveRef({
    setFrets: (next) => calls.push(["frets", next]),
    handleStringsChange: (next) => calls.push(["strings", next]),
  });

  const shortcuts = buildShortcutTableFromRefs(liveRef);
  const handler = createShortcutHandler(shortcuts, { enabled: true });
  const fretsDownShortcut = shortcuts.find((entry) => entry.combo === "-");
  assert.ok(fretsDownShortcut);

  fireKey(handler, "]");
  fretsDownShortcut.handler();

  liveRef.current.strings = 7;
  liveRef.current.frets = 25;

  fireKey(handler, "]");
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
  const liveRef = makeLiveRef({
    practiceActions: {
      toggleMetronome: () => {
        initialToggleCalls += 1;
      },
    },
  });

  const shortcuts = buildShortcutTableFromRefs(liveRef);
  const handler = createShortcutHandler(shortcuts, { enabled: true });

  fireKey(handler, "m", MODAL_TARGET);
  assert.equal(initialToggleCalls, 0);

  liveRef.current.practiceActions = {
    toggleMetronome: () => {
      latestToggleCalls += 1;
    },
  };
  fireKey(handler, "m");

  assert.equal(initialToggleCalls, 0);
  assert.equal(latestToggleCalls, 1);
});

test("hotkey table lets keys pass through when their action is not wired", () => {
  const shortcuts = buildShortcutTableFromRefs(makeLiveRef());
  const handler = createShortcutHandler(shortcuts, { enabled: true });

  // makeLiveRef leaves setDisplayPrefs/setFrets/setShowChord unset.
  for (const key of ["o", "-", "c"]) {
    assert.equal(fireKey(handler, key), false, key);
  }
});

test("accidental hotkey cycles sharp -> flat -> both -> sharp", () => {
  const state = { accidental: "sharp" };
  const liveRef = {
    current: {
      setDisplayPrefs: (updater) => updater(state),
      minDot: 8,
      maxDot: 24,
      minStrings: 4,
      maxStrings: 8,
      minFrets: 12,
      maxFrets: 30,
    },
  };

  const shortcuts = buildShortcutTableFromRefs(liveRef);
  const toggleAccidental = shortcuts.find((entry) => entry.combo === "a");
  assert.ok(toggleAccidental);

  toggleAccidental.handler();
  assert.equal(state.accidental, "flat");
  toggleAccidental.handler();
  assert.equal(state.accidental, "both");
  toggleAccidental.handler();
  assert.equal(state.accidental, "sharp");
});
