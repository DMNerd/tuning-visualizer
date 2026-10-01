import test from "node:test";
import assert from "node:assert/strict";

import {
  migrateScaleFavoriteKey,
  migrateScaleLabel,
  scalesForSystem,
} from "@domain/theory/scales";

const byLabel = (scales) =>
  Object.fromEntries(scales.map(({ label, pcs }) => [label, pcs]));

test("12-TET offers the theory engine's scales, sorted by label", () => {
  const scales = scalesForSystem("12-TET", 12);
  const labels = scales.map(({ label }) => label);
  assert.deepEqual(
    labels,
    [...labels].sort((a, b) => a.localeCompare(b)),
  );
  const pcs = byLabel(scales);
  assert.deepEqual(pcs["Major"], [0, 2, 4, 5, 7, 9, 11]);
  assert.deepEqual(pcs["Half-Whole Diminished"], [0, 1, 3, 4, 6, 7, 9, 10]);
  assert.equal(pcs["Chromatic"].length, 12);
  assert.ok(scales.length > 80);
  // no microtonal scales where an up is a sharp
  assert.equal(pcs["Rast"], undefined);
});

test("microtonal scales where ups and downs are finer than sharps", () => {
  const pcs = byLabel(scalesForSystem("24-TET", 24));
  assert.deepEqual(pcs["Rast"], [0, 4, 7, 10, 14, 18, 21]);
  assert.deepEqual(pcs["Husayni"], [0, 3, 6, 10, 14, 17, 20]);
  assert.ok(pcs["Dril"]);
  // 31-EDO neutral third: 9 steps
  assert.deepEqual(
    byLabel(scalesForSystem("31-TET", 31))["Mahur"],
    [0, 5, 9, 13, 18, 23, 28],
  );
});

test("temperament scales in their EDOs", () => {
  assert.deepEqual(
    byLabel(scalesForSystem("22-TET", 22))["Porcupine[7]"],
    [0, 4, 7, 10, 13, 16, 19],
  );
  assert.ok(byLabel(scalesForSystem("19-TET", 19))["Magic[7]"]);
  assert.equal(
    byLabel(scalesForSystem("31-TET", 31))["Porcupine[7]"],
    undefined,
  );
});

test("scales with the same notes are listed once", () => {
  for (const edo of [7, 12, 19, 24]) {
    const keys = scalesForSystem(`${edo}-TET`, edo).map(({ pcs }) =>
      pcs.join(","),
    );
    assert.equal(new Set(keys).size, keys.length, `${edo}-TET`);
  }
});

test("migrateScaleLabel maps labels of older versions", () => {
  assert.equal(migrateScaleLabel("Major (Ionian)"), "Major");
  assert.equal(migrateScaleLabel("24TET Major (Ionian)"), "Major");
  assert.equal(migrateScaleLabel("24TET Dorian (doubled)"), "Dorian");
  assert.equal(
    migrateScaleLabel("24TET Diminished (H-W, doubled)"),
    "Half-Whole Diminished",
  );
  assert.equal(migrateScaleLabel("Chromatic (12)"), "Chromatic");
  assert.equal(migrateScaleLabel("24TET Uşşak (Uşşâk)"), "Husayni");
  assert.equal(migrateScaleLabel("Major w/ Neutral 3rd"), "Mahur");
  assert.equal(migrateScaleLabel("19-TET Generic Major-like (19)"), "Major");
  assert.equal(migrateScaleLabel("19-TET Chromatic (19)"), "Chromatic");
  // current labels are left alone
  assert.equal(migrateScaleLabel("Dorian"), "Dorian");
  assert.equal(migrateScaleLabel("Porcupine[7]"), "Porcupine[7]");
});

test("migrateScaleFavoriteKey keeps the system id", () => {
  assert.equal(
    migrateScaleFavoriteKey("12-TET-Major (Ionian)"),
    "12-TET-Major",
  );
  assert.equal(
    migrateScaleFavoriteKey("24-TET-24TET Chromatic (24)"),
    "24-TET-Chromatic",
  );
  assert.equal(
    migrateScaleFavoriteKey("12-TET-Half-Whole Diminished"),
    "12-TET-Half-Whole Diminished",
  );
});
