import test from "node:test";
import assert from "node:assert/strict";

import { parseTuningPack } from "@/lib/tuningIO/schema";

const basePack = {
  version: 2,
  name: "Example Tuning",
  system: { edo: 12 },
  tuning: { strings: [] },
};

test("parseTuningPack rejects packs with non-positive edo", () => {
  const invalid = {
    ...basePack,
    system: { edo: 0 },
  };

  assert.throws(
    () => parseTuningPack(invalid),
    /System edo must be at least 1\./,
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
