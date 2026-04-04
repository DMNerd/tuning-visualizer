import test from "node:test";
import assert from "node:assert/strict";

import { applyValueOrUpdaterOnDraft } from "@/utils/applyValueOrUpdaterOnDraft";

void test("direct value assignment updates draftContainer[key]", () => {
  const container = {
    target: { value: 1 },
    untouched: "keep",
  };

  applyValueOrUpdaterOnDraft(container, "target", { value: 42 });

  assert.deepEqual(container.target, { value: 42 });
  assert.equal(container.untouched, "keep");
});

void test("updater mutation with undefined return persists mutations", () => {
  const container = {
    target: { count: 1, tags: ["a"] },
    untouched: "keep",
  };

  applyValueOrUpdaterOnDraft(container, "target", (draft) => {
    draft.count += 1;
    draft.tags.push("b");
  });

  assert.deepEqual(container.target, { count: 2, tags: ["a", "b"] });
  assert.equal(container.untouched, "keep");
});

void test("updater returned replacement value is assigned", () => {
  const container = {
    target: { count: 1 },
    untouched: "keep",
  };

  applyValueOrUpdaterOnDraft(container, "target", () => ({
    count: 999,
  }));

  assert.deepEqual(container.target, { count: 999 });
  assert.equal(container.untouched, "keep");
});

void test("non-target keys remain unchanged", () => {
  const container = {
    target: [1, 2, 3],
    untouched: { label: "stable" },
    another: 7,
  };

  applyValueOrUpdaterOnDraft(container, "target", (draft) => {
    draft.splice(1, 1);
  });

  assert.deepEqual(container.target, [1, 3]);
  assert.deepEqual(container.untouched, { label: "stable" });
  assert.equal(container.another, 7);
});
