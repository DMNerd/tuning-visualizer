import test from "node:test";
import assert from "node:assert/strict";

import { TUNINGS } from "@domain/theory/tuning";
import {
  buildNameToPcMap,
  nameForPcWithDisplayAccidentals,
} from "@features/fretboard/hooks/usePitchMapping";

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

test("both accidental display emits slash names while preserving natural notes", () => {
  const system = TUNINGS["12-TET"];

  assert.equal(nameForPcWithDisplayAccidentals(system, 6, "both"), "F#/Gb");
  assert.equal(nameForPcWithDisplayAccidentals(system, 0, "both"), "C");
});
