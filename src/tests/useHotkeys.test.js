import test from "node:test";
import assert from "node:assert/strict";

import { normalizeComboKey, parseCombo } from "@/hooks/hotkeyUtils";

test("parseCombo handles shift+/ and keeps slash key", () => {
  const parsed = parseCombo("shift+/");
  assert.deepEqual(parsed, {
    keyPart: "/",
    modifiers: {
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      shiftKey: true,
    },
  });
  assert.equal(normalizeComboKey(parsed.keyPart), "/");
});

test("parseCombo handles alt+] modifier parsing", () => {
  const parsed = parseCombo("alt+]");
  assert.deepEqual(parsed, {
    keyPart: "]",
    modifiers: {
      altKey: true,
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
    },
  });
});

test("parseCombo handles meta+n and normalizes key casing", () => {
  const parsed = parseCombo("meta+N");
  assert.deepEqual(parsed, {
    keyPart: "N",
    modifiers: {
      altKey: false,
      ctrlKey: false,
      metaKey: true,
      shiftKey: false,
    },
  });
  assert.equal(normalizeComboKey(parsed.keyPart), "n");
});
