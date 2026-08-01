import test from "node:test";
import assert from "node:assert/strict";

import { advancePlaybackBeat } from "@features/training/model/routinePlaybackEngine";
import type { RoutineScaleBlock } from "@features/training/model/routine";

function makeStep(
  overrides: Partial<RoutineScaleBlock> = {},
): RoutineScaleBlock {
  return {
    id: "step",
    scaleLabel: "Major (Ionian)",
    rootPc: 0,
    beats: 4,
    bpm: 100,
    timeSig: "4/4",
    ...overrides,
  };
}

void test("advancePlaybackBeat increments within a step without changing it", () => {
  const steps = [makeStep({ beats: 4 })];
  const result = advancePlaybackBeat({ steps, stepIndex: 0, elapsedBeats: 1 });
  assert.deepEqual(result, {
    done: false,
    stepIndex: 0,
    elapsedBeats: 2,
    stepChanged: false,
  });
});

void test("advancePlaybackBeat crosses a step boundary and resets elapsedBeats", () => {
  const steps = [
    makeStep({ id: "a", beats: 4 }),
    makeStep({ id: "b", beats: 8 }),
  ];
  const result = advancePlaybackBeat({ steps, stepIndex: 0, elapsedBeats: 3 });
  assert.deepEqual(result, {
    done: false,
    stepIndex: 1,
    elapsedBeats: 0,
    stepChanged: true,
  });
});

void test("advancePlaybackBeat reports done on the last beat of the last step", () => {
  const steps = [
    makeStep({ id: "a", beats: 4 }),
    makeStep({ id: "b", beats: 2 }),
  ];
  const result = advancePlaybackBeat({ steps, stepIndex: 1, elapsedBeats: 1 });
  assert.deepEqual(result, { done: true });
});

void test("advancePlaybackBeat handles a single-step, single-beat routine", () => {
  const steps = [makeStep({ beats: 1 })];
  const result = advancePlaybackBeat({ steps, stepIndex: 0, elapsedBeats: 0 });
  assert.deepEqual(result, { done: true });
});

void test("advancePlaybackBeat reports done when called with an out-of-range stepIndex", () => {
  const steps = [makeStep({ beats: 4 })];
  const result = advancePlaybackBeat({ steps, stepIndex: 5, elapsedBeats: 0 });
  assert.deepEqual(result, { done: true });
});
