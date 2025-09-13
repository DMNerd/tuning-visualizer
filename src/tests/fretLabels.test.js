import test from "node:test";
import assert from "node:assert/strict";

import { buildFretLabel } from "@/utils/fretLabels.js";

test("24-TET uses lettered micro-fret labels", () => {
  assert.equal(buildFretLabel(3, 24), "1a");
});

test("Non-multiple N returns fractional label", () => {
  assert.equal(buildFretLabel(1, 19), "0+12/19");
});
