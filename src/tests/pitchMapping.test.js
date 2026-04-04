import test from "node:test";
import assert from "node:assert/strict";

import { TUNINGS } from "@/lib/theory/tuning";
import { buildNameToPcMap } from "@/hooks/usePitchMapping";

test("german naming keeps B/H pitch classes distinct", () => {
  const map = buildNameToPcMap(TUNINGS["12-TET"], "german", "flat");

  assert.equal(map.get("B"), 10);
  assert.equal(map.get("H"), 11);
});

test("german naming keeps B/H parsing stable even in sharp accidental mode", () => {
  const map = buildNameToPcMap(TUNINGS["12-TET"], "german", "sharp");

  assert.equal(map.get("B"), 10);
  assert.equal(map.get("H"), 11);
});

test("english naming still treats B as pitch class 11", () => {
  const map = buildNameToPcMap(TUNINGS["12-TET"], "english", "sharp");

  assert.equal(map.get("B"), 11);
});
