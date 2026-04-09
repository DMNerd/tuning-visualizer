import test from "node:test";
import assert from "node:assert/strict";

import { scheduleBeatUiUpdateWithAudioClock } from "../hooks/useMetronomeEngine.js";

test("scheduleBeatUiUpdateWithAudioClock derives delay from audio clock", () => {
  const calls = [];
  const setTimeoutFn = (callback, delayMs) => {
    calls.push({ callback, delayMs });
    return 101;
  };

  const uiTimerIdsRef = { current: [] };

  const result = scheduleBeatUiUpdateWithAudioClock({
    ctx: { currentTime: 10 },
    when: 10.05,
    beatNumber: 2,
    barNumber: 1,
    setCursor: () => {},
    onBeatRef: { current: null },
    uiTimerIdsRef,
    setTimeoutFn,
  });

  assert.ok(Math.abs(result.delayMs - 50) < 0.001);
  assert.ok(Math.abs(calls[0].delayMs - 50) < 0.001);
  assert.deepEqual(uiTimerIdsRef.current, [101]);
});

test("scheduleBeatUiUpdateWithAudioClock clamps negative delay to zero", () => {
  const calls = [];
  const setTimeoutFn = (callback, delayMs) => {
    calls.push({ callback, delayMs });
    return 202;
  };

  scheduleBeatUiUpdateWithAudioClock({
    ctx: { currentTime: 3.5 },
    when: 3.2,
    beatNumber: 1,
    barNumber: 1,
    setCursor: () => {},
    onBeatRef: { current: null },
    uiTimerIdsRef: { current: [] },
    setTimeoutFn,
  });

  assert.equal(calls[0].delayMs, 0);
});

test("scheduled callback updates cursor and invokes onBeat handler", () => {
  let cursorUpdate = null;
  let onBeatPayload = null;
  let queuedCallback = null;

  const setTimeoutFn = (callback) => {
    queuedCallback = callback;
    return 303;
  };

  const onBeatRef = {
    current: (payload) => {
      onBeatPayload = payload;
    },
  };

  scheduleBeatUiUpdateWithAudioClock({
    ctx: { currentTime: 1 },
    when: 1.125,
    beatNumber: 4,
    barNumber: 2,
    setCursor: (next) => {
      cursorUpdate = next;
    },
    onBeatRef,
    uiTimerIdsRef: { current: [] },
    setTimeoutFn,
  });

  queuedCallback?.();

  assert.deepEqual(cursorUpdate, { currentBeat: 4, currentBar: 2 });
  assert.deepEqual(onBeatPayload, { beat: 4, bar: 2, when: 1.125 });
});
