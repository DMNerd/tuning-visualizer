import test from "node:test";
import assert from "node:assert/strict";

import { buildDegreePalette, getDegreeColor } from "./degreeColors.js";

test("buildDegreePalette assigns root and evenly spaced hues", () => {
  const palette = buildDegreePalette(3, {
    rootColor: "red",
    saturation: 50,
    lightness: 50,
    rotate: 0,
  });
  assert.deepEqual(palette.slice(1), [
    "red",
    "hsl(0 50% 50%)",
    "hsl(180 50% 50%)",
  ]);
});

test("getDegreeColor returns palette color and falls back for invalid", () => {
  assert.equal(
    getDegreeColor(2, 3, { saturation: 50, lightness: 50 }),
    "hsl(0 50% 50%)",
  );
  assert.equal(getDegreeColor(4, 3), "var(--note)");
  assert.equal(getDegreeColor(0, 3), "var(--note)");
});