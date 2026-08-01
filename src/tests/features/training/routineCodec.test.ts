import test from "node:test";
import assert from "node:assert/strict";

import { encodeBase64Url } from "@shared/lib/base64url";
import { stableStringify } from "@shared/lib/stableStringify";
import { decodeRoutine, encodeRoutine } from "@features/training/model/routineCodec";
import type { Routine } from "@features/training/model/routine";
import {
  ROUTINE_BEATS_MAX,
  ROUTINE_BEATS_MIN,
  ROUTINE_BPM_MAX,
} from "@features/training/model/routineLimits";
import { ROUTINE_SCHEMA_VERSION } from "@features/training/model/routineSchema";

function buildFixtureRoutine(): Routine {
  return {
    id: "routine-1",
    name: "Odd meter warmup",
    createdAt: 1000,
    updatedAt: 2000,
    startBlock: {
      systemId: "12-TET",
      presetName: "Standard (EADGBE)",
      beats: 4,
    },
    steps: [
      {
        id: "step-1",
        scaleLabel: "Major (Ionian)",
        rootPc: 0,
        beats: 8,
        bpm: 100,
        timeSig: "4/4",
      },
      {
        id: "step-2",
        scaleLabel: "Dorian",
        rootPc: 2,
        beats: 16,
        bpm: 120,
        timeSig: "7/4",
      },
      {
        id: "step-3",
        scaleLabel: "Phrygian Dominant",
        rootPc: 7,
        beats: 8,
        bpm: 90,
        timeSig: "7/8",
      },
    ],
  };
}

void test("encodeRoutine/decodeRoutine round-trips a routine with a 7/4 block", () => {
  const routine = buildFixtureRoutine();
  const decoded = decodeRoutine(encodeRoutine(routine));
  assert.deepEqual(decoded, routine);
});

void test("decodeRoutine rejects a wrong top-level shape", () => {
  const token = encodeBase64Url(stableStringify({ foo: "bar" }));
  assert.equal(decodeRoutine(token), null);
});

void test("decodeRoutine rejects an unknown tuning system", () => {
  const routine = buildFixtureRoutine();
  const tampered = {
    v: ROUTINE_SCHEMA_VERSION,
    r: { ...routine, startBlock: { ...routine.startBlock, systemId: "9-TET" } },
  };
  const token = encodeBase64Url(stableStringify(tampered));
  assert.equal(decodeRoutine(token), null);
});

void test("decodeRoutine clamps/defaults out-of-range or invalid step fields instead of dropping the routine", () => {
  const tampered = {
    v: ROUTINE_SCHEMA_VERSION,
    r: {
      id: "routine-1",
      name: 12345, // wrong type -> coerced to ""
      startBlock: { systemId: "12-TET", presetName: "X", beats: 999999 },
      steps: [
        {
          id: "step-1",
          scaleLabel: "Major (Ionian)",
          rootPc: -5,
          beats: -10,
          bpm: 99999,
          timeSig: "13/16", // not a recognized routine time signature
        },
      ],
    },
  };
  const token = encodeBase64Url(stableStringify(tampered));
  const decoded = decodeRoutine(token);

  assert.notEqual(decoded, null);
  assert.equal(decoded?.name, "");
  assert.equal(decoded?.startBlock.beats, ROUTINE_BEATS_MAX);
  assert.equal(decoded?.steps[0]?.rootPc, 0);
  assert.equal(decoded?.steps[0]?.beats, ROUTINE_BEATS_MIN);
  assert.equal(decoded?.steps[0]?.bpm, ROUTINE_BPM_MAX);
  assert.equal(decoded?.steps[0]?.timeSig, "4/4");
});

void test("decodeRoutine deduplicates colliding step ids", () => {
  const tampered = {
    v: ROUTINE_SCHEMA_VERSION,
    r: {
      id: "routine-1",
      startBlock: { systemId: "12-TET", beats: 4 },
      steps: [
        { id: "dup", scaleLabel: "A", rootPc: 0, beats: 4, bpm: 80, timeSig: "4/4" },
        { id: "dup", scaleLabel: "B", rootPc: 1, beats: 4, bpm: 80, timeSig: "4/4" },
      ],
    },
  };
  const token = encodeBase64Url(stableStringify(tampered));
  const decoded = decodeRoutine(token);

  assert.equal(decoded?.steps.length, 2);
  assert.notEqual(decoded?.steps[0]?.id, decoded?.steps[1]?.id);
});

void test("decodeRoutine returns null for garbage input, never throws", () => {
  assert.equal(decodeRoutine("!!!not base64 json!!!"), null);
  assert.equal(decodeRoutine(""), null);
  assert.equal(decodeRoutine(encodeBase64Url("not json at all")), null);
});
