import test from "node:test";
import assert from "node:assert/strict";

import { buildChordPCsFromPc, degreeForStep } from "@/lib/theory/chords";

const sort = (arr) => [...arr].sort((a, b) => a - b);

test("buildChordPCsFromPc wraps pitch classes for 12-TET", () => {
  const pcs = buildChordPCsFromPc(10, "min", 12);
  assert.deepEqual(sort(pcs), [1, 5, 10]);
});

test("buildChordPCsFromPc wraps pitch classes for 24-TET", () => {
  const pcs = buildChordPCsFromPc(23, "maj", 24);
  assert.deepEqual(sort(pcs), [7, 13, 23]);
});

test("degreeForStep maps steps to degrees in 12-TET", () => {
  assert.equal(degreeForStep(4, 12), "3");
  assert.equal(degreeForStep(7, 12), "5");
});

test("degreeForStep approximates degrees in 24-TET", () => {
  assert.equal(degreeForStep(1, 24), "b2");
  assert.equal(degreeForStep(10, 24), "4");
});

test("degreeForStep handles generic EDOs", () => {
  assert.equal(degreeForStep(9, 19), "b5");
  assert.equal(degreeForStep(-1, 19), "7");
});