import test from "node:test";
import assert from "node:assert/strict";

import { STR_MAX, STR_MIN } from "@/lib/config/appDefaults";
import { parseTuningPack } from "@/lib/export/schema";
import { removePackByIdentifier } from "@/lib/export/tuningIO";
import { coerceAnyTuning } from "@/hooks/usePresetBuilder";
import { sanitizeBoardMetaForModeStorage } from "@/lib/presets/neckFilterModes";

const basePack = {
  name: "Example Tuning",
  system: { edo: 12 },
  tuning: {
    strings: Array.from({ length: STR_MIN }, () => ({ note: "E4" })),
  },
};

test("parseTuningPack accepts legacy packs with version", () => {
  const legacy = { ...basePack, version: 2 };
  const parsed = parseTuningPack(legacy);

  assert.equal(Object.prototype.hasOwnProperty.call(parsed, "version"), false);
  assert.equal(parsed.name, basePack.name);
});

test("parseTuningPack rejects packs with non-positive edo", () => {
  const invalid = {
    ...basePack,
    system: { edo: 0 },
  };

  assert.throws(
    () => parseTuningPack(invalid),
    /System edo must be at least 12\./,
  );
});

test("parseTuningPack rejects packs with non-integer edo", () => {
  const invalid = {
    ...basePack,
    system: { edo: 12.5 },
  };

  assert.throws(
    () => parseTuningPack(invalid),
    /System edo must be an integer value\./,
  );
});

test("parseTuningPack rejects strings missing note and midi", () => {
  const invalid = {
    ...basePack,
    tuning: {
      strings: [
        { label: "String 1" },
        ...Array.from({ length: STR_MIN - 1 }, () => ({ note: "E4" })),
      ],
    },
  };

  assert.throws(
    () => parseTuningPack(invalid),
    /Each string must include a note or MIDI value\./,
  );
});

test("parseTuningPack rejects packs with too few strings", () => {
  const invalid = {
    ...basePack,
    tuning: {
      strings: Array.from({ length: STR_MIN - 1 }, () => ({ note: "E4" })),
    },
  };

  assert.throws(
    () => parseTuningPack(invalid),
    new RegExp(`Tuning pack must include at least ${STR_MIN} strings.`),
  );
});

test("parseTuningPack rejects packs with too many strings", () => {
  const invalid = {
    ...basePack,
    tuning: {
      strings: Array.from({ length: STR_MAX + 1 }, () => ({ note: "E4" })),
    },
  };

  assert.throws(
    () => parseTuningPack(invalid),
    new RegExp(`Tuning pack may include at most ${STR_MAX} strings.`),
  );
});

test("parseTuningPack accepts packs that meet string requirements", () => {
  const valid = {
    ...basePack,
    tuning: {
      strings: Array.from({ length: STR_MIN }, (_, index) =>
        index % 2 === 0 ? { note: "E4" } : { midi: 64 + index },
      ),
    },
  };

  assert.doesNotThrow(() => parseTuningPack(valid));
});

test("parseTuningPack preserves optional top-level spelling field", () => {
  const withSpelling = {
    ...basePack,
    spelling: "de-h/b",
  };

  const parsed = parseTuningPack(withSpelling);

  assert.equal(parsed.spelling, "de-h/b");
});

test("parseTuningPack trims top-level spelling and omits blank values", () => {
  const spaced = parseTuningPack({
    ...basePack,
    spelling: "  czech  ",
  });
  assert.equal(spaced.spelling, "czech");

  const blank = parseTuningPack({
    ...basePack,
    spelling: "   ",
  });
  assert.equal(Object.prototype.hasOwnProperty.call(blank, "spelling"), false);
});

test("parsed custom pack spelling hint is preserved for downstream coercion", () => {
  const parsed = parseTuningPack({
    ...basePack,
    spelling: "czech",
    tuning: {
      strings: [
        { note: "H" },
        { note: "B" },
        ...Array.from({ length: STR_MIN - 2 }, () => ({ note: "E" })),
      ],
    },
  });

  const normalized = coerceAnyTuning(parsed);
  assert.deepEqual(normalized.slice(0, 2), ["B", "Bb"]);
});

test("removePackByIdentifier removes packs with empty names using meta id", () => {
  const packs = [
    { name: "", meta: { id: "pack-a" } },
    { name: "", meta: { id: "pack-b" } },
  ];

  const result = removePackByIdentifier(packs, { meta: { id: "pack-a" } });

  assert.equal(result.length, 1);
  assert.equal(result[0].meta.id, "pack-b");
});

test("removePackByIdentifier removes only the targeted duplicate-named pack", () => {
  const packs = [
    { name: "Duplicate", meta: { id: "pack-1" } },
    { name: "Duplicate", meta: { id: "pack-2" } },
    { name: "Duplicate", meta: { id: "pack-3" } },
  ];

  const result = removePackByIdentifier(packs, { meta: { id: "pack-2" } });

  assert.equal(result.length, 2);
  assert.deepEqual(
    result.map((pack) => pack.meta.id),
    ["pack-1", "pack-3"],
  );
});

test("sanitizeBoardMetaForModeStorage omits default fretless style fields when mode intent is fretless", () => {
  const sanitized = sanitizeBoardMetaForModeStorage({
    neckFilterMode: "fretless",
    fretStyle: "dotted",
    notePlacement: "onFret",
    marker: "keep",
  });

  assert.deepEqual(sanitized, {
    neckFilterMode: "fretless",
    marker: "keep",
  });
});

test("sanitizeBoardMetaForModeStorage preserves notePlacement meta without fretless mode", () => {
  const sanitized = sanitizeBoardMetaForModeStorage({
    notePlacement: "onFret",
    fretStyle: "solid",
  });

  assert.deepEqual(sanitized, {
    notePlacement: "onFret",
    fretStyle: "solid",
  });
});
