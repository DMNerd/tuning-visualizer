import test from "node:test";
import assert from "node:assert/strict";

import { migrateScaleLabel, scalesForSystem } from "@domain/theory/scales";

const byLabel = (scales) =>
  Object.fromEntries(scales.map(({ label, pcs }) => [label, pcs]));

test("other EDOs get the standard scales", () => {
  const scales = byLabel(scalesForSystem("19-TET", 19));
  assert.deepEqual(scales["Chromatic (19)"].length, 19);
  assert.deepEqual(scales["Major (Ionian)"], [0, 3, 6, 8, 11, 14, 17]);
  assert.deepEqual(scales["Dorian"], [0, 3, 5, 8, 11, 14, 16]);
  // 19-EDO has no quarter tones: no microtonal scales
  assert.equal(scales["Uşşak (Uşşâk)"], undefined);
});

test("microtonal scales where ups and downs are finer than sharps", () => {
  const scales = byLabel(scalesForSystem("31-TET", 31));
  // 31-EDO neutral third: 9 steps
  assert.deepEqual(scales["Major w/ Neutral 3rd"], [0, 5, 9, 13, 18, 23, 28]);
});

test("scales with the same notes are listed once", () => {
  const scales = scalesForSystem("7-TET", 7);
  const keys = scales.map(({ pcs }) => pcs.join(","));
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(scales[0].label, "Chromatic (7)");
});

test("migrateScaleLabel maps old custom-EDO labels", () => {
  assert.equal(
    migrateScaleLabel("19-TET Generic Major-like (19)"),
    "Major (Ionian)",
  );
  assert.equal(
    migrateScaleLabel("31-TET Generic Minor Pentatonic-like (31)"),
    "Minor Pentatonic",
  );
  assert.equal(migrateScaleLabel("19-TET Chromatic (19)"), "Chromatic (19)");
  // current labels are left alone
  assert.equal(
    migrateScaleLabel("24TET Chromatic (24)"),
    "24TET Chromatic (24)",
  );
  assert.equal(migrateScaleLabel("Dorian"), "Dorian");
});
