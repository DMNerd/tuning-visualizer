import test from "node:test";
import assert from "node:assert/strict";

import {
  freqToStep,
  stepToFreq,
  midiToStep,
  stepToMidi,
  stepToPc,
  centsFromNearest,
  nameFallback,
} from "@/lib/theory/tuning";

function makeSystem(divisions) {
  return {
    id: `${divisions}-TET`,
    divisions,
    refFreq: 440,
    refMidi: 69,
    nameForPc: nameFallback,
  };
}

test("freq <-> step roundtrip for arbitrary N", () => {
  const sys = makeSystem(19);
  for (let step = -5; step <= 5; step++) {
    const f = stepToFreq(step, sys);
    assert.equal(freqToStep(f, sys), step);
  }
});

test("midi <-> step roundtrip for arbitrary N", () => {
  const sys = makeSystem(19);
  for (let midi = 60; midi <= 72; midi++) {
    const step = midiToStep(midi, sys);
    assert.equal(stepToMidi(step, sys), midi);
  }
});

test("stepToPc wraps within divisions", () => {
  const sys = makeSystem(19);
  assert.equal(stepToPc(19, sys), 0);
  assert.equal(stepToPc(-1, sys), 18);
});

test("centsFromNearest is zero at exact step", () => {
  const sys = makeSystem(19);
  const f = stepToFreq(3, sys);
  const { cents, nearestStep } = centsFromNearest(f, sys);
  assert.equal(nearestStep, 3);
  assert.ok(Math.abs(cents) < 1e-6);
});

test("centsFromNearest reports small detunings across systems", () => {
  const detuneCents = [5, -5];
  for (const divisions of [12, 24]) {
    const sys = makeSystem(divisions);
    for (const centsTarget of detuneCents) {
      const ratio = Math.pow(2, centsTarget / 1200);
      const f = sys.refFreq * ratio;
      const { cents, nearestStep } = centsFromNearest(f, sys);
      assert.equal(
        Math.abs(nearestStep),
        0,
        `nearest step should be 0 for ${divisions}-TET`,
      );
      assert.ok(
        Math.abs(cents - centsTarget) < 1e-6,
        `expected ${centsTarget} cents in ${divisions}-TET, got ${cents}`,
      );
    }
  }
});