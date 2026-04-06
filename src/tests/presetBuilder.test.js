import test from "node:test";
import assert from "node:assert/strict";
import { coerceAnyTuning } from "@/hooks/usePresetBuilder";

test("coerceAnyTuning translates german B/H note names to intl when requested", () => {
  const pack = {
    tuning: {
      strings: [{ note: "H" }, { note: "B" }, { note: "Fis" }],
    },
  };

  assert.deepEqual(coerceAnyTuning(pack, { translateGerman: true }), [
    "B",
    "Bb",
    "F#",
  ]);
});

test("coerceAnyTuning preserves intl spellings in english mode", () => {
  const pack = {
    tuning: {
      strings: [{ note: "B" }, { note: "Bb" }, { note: "F#" }],
    },
  };

  assert.deepEqual(coerceAnyTuning(pack), ["B", "Bb", "F#"]);
});

test("coerceAnyTuning auto-translates germanic presets when spelling var is present", () => {
  const pack = {
    spelling: "czech",
    tuning: {
      strings: [{ note: "H" }, { note: "B" }],
    },
  };

  assert.deepEqual(coerceAnyTuning(pack), ["B", "Bb"]);
});

test("coerceAnyTuning translates germanic microtonal suffixes when spelling is czech", () => {
  const pack = {
    spelling: "czech",
    tuning: {
      strings: [{ note: "Hih" }, { note: "Aisih" }, { note: "Aeh" }],
    },
  };

  assert.deepEqual(coerceAnyTuning(pack), ["B↑", "A#↑", "A↓"]);
});

test("coerceAnyTuning keeps mixed standard and microtonal entries stable under spelling hint", () => {
  const pack = {
    spelling: "czech",
    tuning: {
      strings: [
        { note: "H" },
        { note: "B" },
        { note: "Fis" },
        { note: "Aisih" },
        { note: "Aeh" },
      ],
    },
  };

  assert.deepEqual(coerceAnyTuning(pack), ["B", "Bb", "F#", "A#↑", "A↓"]);
});

test("coerceAnyTuning does not translate germanic microtonal tokens without spelling hint", () => {
  const pack = {
    tuning: {
      strings: [{ note: "Hih" }, { note: "Aisih" }, { note: "Aeh" }],
    },
  };

  assert.deepEqual(coerceAnyTuning(pack), ["Hih", "Aisih", "Aeh"]);
});

test("coerceAnyTuning recognizes spelling aliases with separator normalization", () => {
  const baseStrings = [{ note: "H" }, { note: "B" }, { note: "Aeh" }];

  const czPack = { spelling: "cz", tuning: { strings: baseStrings } };
  const deDashPack = { spelling: "de-h/b", tuning: { strings: baseStrings } };
  const deUnderscorePack = {
    spelling: "de_h/b",
    tuning: { strings: baseStrings },
  };
  const deSpacedPack = { spelling: "de h b", tuning: { strings: baseStrings } };

  assert.deepEqual(coerceAnyTuning(czPack), ["B", "Bb", "A↓"]);
  assert.deepEqual(coerceAnyTuning(deDashPack), ["B", "Bb", "A↓"]);
  assert.deepEqual(coerceAnyTuning(deUnderscorePack), ["B", "Bb", "A↓"]);
  assert.deepEqual(coerceAnyTuning(deSpacedPack), ["B", "Bb", "A↓"]);
});

test("coerceAnyTuning shares note-token trim semantics with UI normalization", () => {
  const pack = {
    spelling: "german",
    tuning: {
      strings: [{ note: "  Hih  " }, { note: "  B  " }],
    },
  };

  assert.deepEqual(coerceAnyTuning(pack), ["B↑", "Bb"]);
});
