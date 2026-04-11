import test from "node:test";
import assert from "node:assert/strict";

import {
  buildRawShareState,
  serializeShareState,
} from "@/app/adapters/shareState";

void test("buildRawShareState emits only codec-consumed raw share shape", () => {
  const customTunings = [{ name: "Drop D", tuning: ["D2", "A2"] }];
  const tuning = [{ note: "E2", formatter: () => "skip" }];
  const stringMeta = { 0: { startFret: 0 } };
  const boardMeta = { hiddenFrets: new Set([1, 2]) };
  const state = buildRawShareState({
    systemId: "12-TET",
    strings: 6,
    frets: 24,
    tuning,
    stringMeta,
    boardMeta,
    selectedPreset: "Drop D",
    customTunings,
  });

  assert.deepEqual(state.theory.system, { systemId: "12-TET" });
  assert.equal("scale" in state.theory, false);
  assert.equal("chord" in state.theory, false);
  assert.equal(state.instrument.presets.selectedPreset, "Drop D");
  assert.equal(state.instrument.instrumentState.tuning, tuning);
  assert.equal(state.instrument.instrumentState.stringMeta, stringMeta);
  assert.equal(state.instrument.instrumentState.boardMeta, boardMeta);
  assert.equal(state.instrument.customTunings, customTunings);
  assert.equal("capo" in state.instrument, false);
  assert.equal("display" in state, false);
  assert.equal("practice" in state, false);
});

void test("serializeShareState preserves previous serializable payload shape", () => {
  const rawState = buildRawShareState({
    systemId: "12-TET",
    strings: 6,
    frets: 24,
    tuning: [{ note: "E2", formatter: () => "skip" }],
    stringMeta: { 0: { startFret: 0 } },
    boardMeta: { hiddenFrets: new Set([1, 2]) },
    selectedPreset: "Drop D",
    customTunings: [{ name: "Drop D", tuning: ["D2", "A2"] }],
  });

  const serialized = serializeShareState(rawState);

  assert.deepEqual(serialized.theory.system, { systemId: "12-TET" });
  assert.equal(serialized.instrument.presets.selectedPreset, "Drop D");
  assert.deepEqual(serialized.instrument.instrumentState.tuning, [
    { note: "E2" },
  ]);
  assert.deepEqual(serialized.instrument.instrumentState.boardMeta, {
    hiddenFrets: [1, 2],
  });
  assert.deepEqual(serialized.instrument.customTunings, [
    { name: "Drop D", tuning: ["D2", "A2"] },
  ]);
});
