import test from "node:test";
import assert from "node:assert/strict";

import {
  decodeBase64UrlBytes,
  encodeBase64Url,
  encodeBase64UrlBytes,
} from "@shared/lib/base64url";
import { stableStringify } from "@shared/lib/stableStringify";
import {
  decodeRoutine,
  encodeRoutine,
} from "@features/training/model/routineCodec";
import type { Routine } from "@features/training/model/routine";
import {
  ROUTINE_BEATS_MAX,
  ROUTINE_BEATS_MIN,
  ROUTINE_BPM_MAX,
} from "@features/training/model/routineLimits";
import { STR_FACTORY, STR_MAX } from "@shared/config/appDefaults";

// Links made before the binary format: base64url JSON with `v: 1`.
const LEGACY_JSON_VERSION = 1;
const legacyToken = (r: unknown) =>
  encodeBase64Url(stableStringify({ v: LEGACY_JSON_VERSION, r }));

// Ids and timestamps aren't part of a link.
function withoutIdentity(routine: Routine | null) {
  if (!routine) return routine;
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = routine;
  return { ...rest, steps: rest.steps.map(({ id: _s, ...step }) => step) };
}

function buildFixtureRoutine(): Routine {
  return {
    id: "routine-1",
    name: "Odd meter warmup",
    createdAt: 1000,
    updatedAt: 2000,
    startBlock: {
      systemId: "12-TET",
      strings: 6,
      presetName: "Standard (EADGBE)",
      beats: 4,
    },
    steps: [
      {
        id: "step-1",
        scaleLabel: "Major",
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
  assert.deepEqual(withoutIdentity(decoded), withoutIdentity(routine));
});

void test("decoded binary links get fresh, unique ids", () => {
  const decoded = decodeRoutine(encodeRoutine(buildFixtureRoutine()));
  const ids = decoded?.steps.map((step) => step.id) ?? [];
  assert.equal(new Set(ids).size, 3);
  assert.ok(!ids.includes("step-1"));
});

void test("binary links round-trip unicode names and an empty routine", () => {
  const routine = {
    ...buildFixtureRoutine(),
    name: "Stupnice ♭ 🎸",
    steps: [],
  };
  const decoded = decodeRoutine(encodeRoutine(routine));
  assert.deepEqual(withoutIdentity(decoded), withoutIdentity(routine));
});

void test("binary links stay short as blocks are added", () => {
  const routine = buildFixtureRoutine();
  const scales = ["Major", "Dorian", "Mixolydian", "Locrian"];
  routine.steps = Array.from({ length: 30 }, (_, i) => ({
    id: `step-${i}`,
    scaleLabel: scales[i % scales.length],
    rootPc: (i * 7) % 12,
    beats: 8,
    bpm: 80 + (i % 3) * 10,
    timeSig: "4/4",
  }));
  const token = encodeRoutine(routine);
  // The JSON format needed ~160 characters per block.
  assert.ok(token.length < 300, `token is ${token.length} chars`);
  assert.deepEqual(
    withoutIdentity(decodeRoutine(token)),
    withoutIdentity(routine),
  );
});

void test("legacy JSON links still decode, keeping their ids", () => {
  const routine = buildFixtureRoutine();
  assert.deepEqual(decodeRoutine(legacyToken(routine)), routine);
});

void test("links saved with older scale labels decode to the current ones", () => {
  const routine = buildFixtureRoutine();
  routine.steps[0].scaleLabel = "Major (Ionian)";
  routine.steps[1].scaleLabel = "24TET Dorian (doubled)";
  const [major, dorian] = decodeRoutine(legacyToken(routine))!.steps;
  assert.equal(major.scaleLabel, "Major");
  assert.equal(dorian.scaleLabel, "Dorian");
});

void test("decodeRoutine rejects truncated binary links and unknown formats", () => {
  const bytes = decodeBase64UrlBytes(encodeRoutine(buildFixtureRoutine()))!;
  for (let length = 1; length < bytes.length - 1; length += 1) {
    const token = encodeBase64UrlBytes(bytes.subarray(0, length));
    assert.equal(decodeRoutine(token), null, `truncated to ${length} bytes`);
  }
  assert.equal(decodeRoutine(encodeBase64UrlBytes(Uint8Array.of(99, 0))), null);
});

void test("decodeRoutine rejects a binary link with an unknown tuning system", () => {
  const routine = buildFixtureRoutine();
  routine.startBlock.systemId = "9-TET";
  assert.equal(decodeRoutine(encodeRoutine(routine)), null);
});

void test("decodeRoutine rejects a wrong top-level shape", () => {
  const token = encodeBase64Url(stableStringify({ foo: "bar" }));
  assert.equal(decodeRoutine(token), null);
});

void test("decodeRoutine rejects an unknown tuning system", () => {
  const routine = buildFixtureRoutine();
  const token = legacyToken({
    ...routine,
    startBlock: { ...routine.startBlock, systemId: "9-TET" },
  });
  assert.equal(decodeRoutine(token), null);
});

void test("decodeRoutine clamps/defaults out-of-range or invalid step fields instead of dropping the routine", () => {
  const token = legacyToken({
    id: "routine-1",
    name: 12345, // wrong type -> coerced to ""
    startBlock: {
      systemId: "12-TET",
      strings: 999,
      presetName: "X",
      beats: 999999,
    },
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
  });
  const decoded = decodeRoutine(token);

  assert.notEqual(decoded, null);
  assert.equal(decoded?.name, "");
  assert.equal(decoded?.startBlock.strings, STR_MAX);
  assert.equal(decoded?.startBlock.beats, ROUTINE_BEATS_MAX);
  assert.equal(decoded?.steps[0]?.rootPc, 0);
  assert.equal(decoded?.steps[0]?.beats, ROUTINE_BEATS_MIN);
  assert.equal(decoded?.steps[0]?.bpm, ROUTINE_BPM_MAX);
  assert.equal(decoded?.steps[0]?.timeSig, "4/4");
});

void test("decodeRoutine deduplicates colliding step ids", () => {
  const token = legacyToken({
    id: "routine-1",
    startBlock: { systemId: "12-TET", beats: 4 },
    steps: [
      {
        id: "dup",
        scaleLabel: "A",
        rootPc: 0,
        beats: 4,
        bpm: 80,
        timeSig: "4/4",
      },
      {
        id: "dup",
        scaleLabel: "B",
        rootPc: 1,
        beats: 4,
        bpm: 80,
        timeSig: "4/4",
      },
    ],
  });
  const decoded = decodeRoutine(token);

  assert.equal(decoded?.steps.length, 2);
  assert.notEqual(decoded?.steps[0]?.id, decoded?.steps[1]?.id);
  assert.equal(decoded?.startBlock.strings, STR_FACTORY);
});

void test("decodeRoutine returns null for garbage input, never throws", () => {
  assert.equal(decodeRoutine("!!!not base64 json!!!"), null);
  assert.equal(decodeRoutine(""), null);
  assert.equal(decodeRoutine(encodeBase64Url("not json at all")), null);
});
