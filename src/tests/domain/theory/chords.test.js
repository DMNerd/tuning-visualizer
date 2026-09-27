import test from "node:test";
import assert from "node:assert/strict";

import { buildChordPCsFromPc } from "@domain/theory/chords";

const sort = (arr) => [...arr].sort((a, b) => a - b);

test("buildChordPCsFromPc wraps pitch classes for 12-TET", () => {
  const pcs = buildChordPCsFromPc(10, "min", 12);
  assert.deepEqual(sort(pcs), [1, 5, 10]);
});

test("buildChordPCsFromPc wraps pitch classes for 24-TET", () => {
  const pcs = buildChordPCsFromPc(23, "maj", 24);
  assert.deepEqual(sort(pcs), [7, 13, 23]);
});
