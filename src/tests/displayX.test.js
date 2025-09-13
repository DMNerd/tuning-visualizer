import test from "node:test";
import assert from "node:assert/strict";

import { makeDisplayX } from "@/utils/displayX.js";

test("makeDisplayX mirrors coordinate when left-handed", () => {
  const width = 100;
  const lefty = makeDisplayX(true, width);
  const righty = makeDisplayX(false, width);
  assert.equal(lefty(25), 75);
  assert.equal(righty(25), 25);
});
