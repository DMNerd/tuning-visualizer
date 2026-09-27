import test from "node:test";
import assert from "node:assert/strict";

import { getPackId, matchesPack } from "@domain/presets/packIdentity";

test("getPackId trims meta.id and defaults to empty", () => {
  assert.equal(getPackId({ meta: { id: " p1 " } }), "p1");
  assert.equal(getPackId({ meta: {} }), "");
  assert.equal(getPackId(null), "");
});

test("matchesPack matches by trimmed id or trimmed name", () => {
  const pack = { name: " Drop D ", meta: { id: "pack-1" } };
  assert.equal(matchesPack(pack, { id: " pack-1 " }), true);
  assert.equal(matchesPack(pack, { name: "Drop D" }), true);
  assert.equal(matchesPack(pack, { id: "other", name: "Drop D" }), true);
  assert.equal(matchesPack(pack, { id: "other", name: "Other" }), false);
});

test("matchesPack never matches on empty wanted values or non-objects", () => {
  assert.equal(matchesPack({ name: "" }, { name: "" }), false);
  assert.equal(matchesPack({ name: "A" }, {}), false);
  assert.equal(matchesPack(null, { name: "A" }), false);
  assert.equal(matchesPack("A", { name: "A" }), false);
});
