import test from "node:test";
import assert from "node:assert/strict";

import {
  RANDOMIZE_MODES,
  applyRandomizedScale,
  formatRandomizedScaleAnnouncement,
} from "@/hooks/useRandomScale";

test("applyRandomizedScale updates state by randomize mode", () => {
  const result = { root: "D", scale: "Dorian" };

  const rootChanges = [];
  const scaleChanges = [];

  applyRandomizedScale({
    result,
    mode: RANDOMIZE_MODES.KeyOnly,
    setRoot: (value) => rootChanges.push(["key", value]),
    setScale: (value) => scaleChanges.push(["key", value]),
  });

  applyRandomizedScale({
    result,
    mode: RANDOMIZE_MODES.ScaleOnly,
    setRoot: (value) => rootChanges.push(["scale", value]),
    setScale: (value) => scaleChanges.push(["scale", value]),
  });

  applyRandomizedScale({
    result,
    mode: RANDOMIZE_MODES.Both,
    setRoot: (value) => rootChanges.push(["both", value]),
    setScale: (value) => scaleChanges.push(["both", value]),
  });

  assert.deepEqual(rootChanges, [
    ["key", "D"],
    ["both", "D"],
  ]);
  assert.deepEqual(scaleChanges, [
    ["scale", "Dorian"],
    ["both", "Dorian"],
  ]);
});

test("formatRandomizedScaleAnnouncement includes the upcoming value", () => {
  const result = { root: "A", scale: "Mixolydian" };

  assert.equal(
    formatRandomizedScaleAnnouncement({
      result,
      mode: RANDOMIZE_MODES.KeyOnly,
    }),
    "root A",
  );

  assert.equal(
    formatRandomizedScaleAnnouncement({
      result,
      mode: RANDOMIZE_MODES.ScaleOnly,
    }),
    "scale Mixolydian",
  );

  assert.equal(
    formatRandomizedScaleAnnouncement({
      result,
      mode: RANDOMIZE_MODES.Both,
    }),
    "A Mixolydian",
  );
});
