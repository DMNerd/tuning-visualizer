import test from "node:test";
import assert from "node:assert/strict";

import { edoInfo, intervalLabel } from "@domain/theory/tonalAdapter";

const labels = (edo) =>
  Array.from({ length: edo }, (_, steps) => intervalLabel(steps, edo));

test("12-TET interval labels are unchanged", () => {
  assert.deepEqual(
    labels(12),
    "P1 m2 M2 m3 M3 P4 TT P5 m6 M6 m7 M7".split(" "),
  );
});

test("other EDOs name every step, quality first", () => {
  // 24-EDO: the neutral third is an upminor third
  assert.equal(intervalLabel(7, 24), "↑m3");
  // 31-EDO: a step below the octave
  assert.equal(intervalLabel(30, 31), "↓P8");
  // 19-EDO needs no ups or downs
  assert.ok(labels(19).every((label) => !/[↑↓]/.test(label)));
});

test("edoInfo describes the EDO's fifth and sharp", () => {
  assert.deepEqual(edoInfo(24), {
    fifthSteps: 14,
    fifthCents: 700,
    fifthErrorCents: -2,
    sharpSteps: 2,
    spelling: "fifths",
  });
  // gv keeps proportional sizing for EDOs whose fifths don't fit (D1)
  assert.equal(edoInfo(28).spelling, "proportional");
});
