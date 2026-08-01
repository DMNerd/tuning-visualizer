import test from "node:test";
import assert from "node:assert/strict";

import { buildRoutineShareModel } from "@features/training/model/routineShareModel";
import { decodeRoutine } from "@features/training/model/routineCodec";
import { ROUTINE_QUERY_KEY } from "@features/training/model/routineSchema";
import type { Routine } from "@features/training/model/routine";

const routine: Routine = {
  id: "routine-1",
  name: "Test routine",
  createdAt: 0,
  updatedAt: 0,
  startBlock: { systemId: "12-TET", presetName: "", beats: 4 },
  steps: [],
};

void test("buildRoutineShareModel preserves unrelated existing query params", () => {
  const model = buildRoutineShareModel({
    routine,
    locationLike: {
      origin: "https://example.test",
      pathname: "/",
      search: "?sys=24-TET",
    },
  });

  const url = new URL(model.canonicalUrl);
  assert.equal(url.searchParams.get("sys"), "24-TET");
  assert.equal(url.searchParams.has(ROUTINE_QUERY_KEY), true);

  const decoded = decodeRoutine(
    url.searchParams.get(ROUTINE_QUERY_KEY) as string,
  );
  assert.equal(decoded?.id, routine.id);
});

void test("buildRoutineShareModel returns an empty evaluation without a routine", () => {
  const model = buildRoutineShareModel({
    routine: null,
    locationLike: { origin: "https://example.test", pathname: "/" },
  });
  assert.equal(model.canonicalUrl, "");
});
