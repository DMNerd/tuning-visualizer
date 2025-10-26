import test from "node:test";
import assert from "node:assert/strict";

import { STR_MAX, STR_MIN } from "@/lib/config/appDefaults";
import { parseTuningPack } from "@/lib/export/schema";

const basePack = {
  version: 2,
  name: "Example Tuning",
  system: { edo: 12 },
  tuning: {
    strings: Array.from({ length: STR_MIN }, () => ({ note: "E4" })),
  },
};

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
