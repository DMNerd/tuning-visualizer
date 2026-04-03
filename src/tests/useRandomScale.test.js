import test from "node:test";
import assert from "node:assert/strict";

import { RANDOMIZE_MODES, applyRandomizedScale } from "@/hooks/useRandomScale";
import { createThrottledTrigger } from "@/hooks/useThrottledTrigger";

test("createThrottledTrigger throttles repeated trigger calls", () => {
  let nowMs = 0;
  let nextTimerId = 1;
  const activeTimers = new Map();
  const calls = [];

  const setTimer = (fn, delay) => {
    const timerId = nextTimerId;
    nextTimerId += 1;
    activeTimers.set(timerId, { fn, dueAt: nowMs + delay });
    return timerId;
  };

  const clearTimer = (timerId) => {
    activeTimers.delete(timerId);
  };

  const runTimersDue = () => {
    const due = [...activeTimers.entries()]
      .filter(([, timer]) => timer.dueAt <= nowMs)
      .sort((a, b) => a[1].dueAt - b[1].dueAt);

    due.forEach(([timerId, timer]) => {
      activeTimers.delete(timerId);
      timer.fn();
    });
  };

  const throttled = createThrottledTrigger({
    callback: () => calls.push(nowMs),
    throttleMs: 100,
    now: () => nowMs,
    setTimer,
    clearTimer,
  });

  throttled.trigger();
  assert.deepEqual(calls, [0]);

  nowMs = 20;
  throttled.trigger();
  throttled.trigger();
  assert.equal(activeTimers.size, 1);
  assert.deepEqual(calls, [0]);

  nowMs = 99;
  runTimersDue();
  assert.deepEqual(calls, [0]);

  nowMs = 100;
  runTimersDue();
  assert.deepEqual(calls, [0, 100]);

  nowMs = 130;
  throttled.runNow();
  assert.deepEqual(calls, [0, 100, 130]);
});

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
