import test from "node:test";
import assert from "node:assert/strict";

import { PRESET_TUNINGS } from "@domain/presets/presetState";
import { resolvePresetNamesForSystem } from "@features/training/model/routine";

void test("resolvePresetNamesForSystem returns sorted preset names for a system+strings combo", () => {
  const expected = Object.keys(PRESET_TUNINGS["12-TET"][6]).sort((a, b) =>
    a.localeCompare(b),
  );
  assert.deepEqual(resolvePresetNamesForSystem("12-TET", 6), expected);
});

void test("resolvePresetNamesForSystem returns an empty array for an unknown system or string count", () => {
  assert.deepEqual(resolvePresetNamesForSystem("9-TET", 6), []);
  assert.deepEqual(resolvePresetNamesForSystem("12-TET", 3), []);
});
