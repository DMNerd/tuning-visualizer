import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSharePayload,
  decodeTuning,
  encodeTuning,
  parseSharePayload,
  resolveInstrumentHydrationValues,
  serializeSharePayload,
} from "@/lib/url/shareCodec";

void test("buildSharePayload only keeps instrument scope + systemId", () => {
  const payload = buildSharePayload({
    theory: {
      system: { systemId: "24-TET", root: "C#" },
    },
    instrument: {
      instrumentState: {
        strings: 12,
        frets: 100,
        tuning: [],
        neckFilterMode: "fretless",
      },
      presets: {
        selectedPreset: "My Shared Pack",
      },
      customTunings: [
        {
          name: "My Shared Pack",
          system: { edo: 24 },
          tuning: { strings: [{ note: "C" }] },
          meta: { id: "pack-123" },
        },
      ],
    },
    display: {
      prefs: {
        lefty: true,
      },
    },
  });

  assert.equal(payload.values.systemId, "24-TET");
  assert.equal(payload.values.strings, 8);
  assert.equal(payload.values.frets, 30);
  assert.equal(payload.values.neckFilterMode, "fretless");
  assert.equal(payload.values.presetName, "My Shared Pack");
  assert.equal(payload.values.packId, "pack-123");
  assert.equal(payload.values.packPayloadVersion, 1);
  assert.equal((payload.values as Record<string, unknown>).lefty, undefined);
});

void test("serializeSharePayload emits compact canonical params", () => {
  const params = serializeSharePayload({
    version: 999,
    values: {
      systemId: "24-TET",
      strings: 6,
      frets: 24,
      tuning: ["E", "B", "G", "D", "A", "E"],
      neckFilterMode: "fretless",
      presetName: "My Shared Pack",
      packId: "pack-123",
      packPayloadVersion: 1,
      packPayload: {
        name: "My Shared Pack",
        system: { edo: 24 },
        tuning: { strings: [{ note: "C" }] },
      },
    },
  });

  assert.equal(params.get("v"), "1");
  assert.equal(params.get("sp"), null);
  assert.equal(params.get("sys"), "24-TET");
  assert.equal(params.get("fr"), null);
  assert.equal(params.get("str"), null);
  assert.equal(params.get("nm"), "fretless");
  assert.equal(params.get("pn"), "My Shared Pack");
  assert.equal(params.get("pid"), "pack-123");
  assert.equal(params.get("pv"), "1");
  assert.equal(
    params.get("pp"),
    '{"name":"My Shared Pack","system":{"edo":24},"tuning":{"strings":[{"note":"C"}]}}',
  );
  assert.equal(params.get("tn"), "E.B.G.D.A.E");
});

void test("serializeSharePayload falls back to JSON tuning for object entries", () => {
  const params = serializeSharePayload({
    version: 1,
    values: {
      tuning: [{ note: "E2", startFret: 0 }],
    },
  });

  assert.equal(params.get("tn"), '[{"note":"E2","startFret":0}]');
});

void test("decodeTuning handles compact and legacy JSON formats", () => {
  assert.deepEqual(decodeTuning("E.B.G.D.A.E"), ["E", "B", "G", "D", "A", "E"]);
  assert.deepEqual(decodeTuning('["E","B","G","D","A","E"]'), [
    "E",
    "B",
    "G",
    "D",
    "A",
    "E",
  ]);
  assert.deepEqual(decodeTuning('[{"note":"E2","startFret":0}]'), [
    { note: "E2", startFret: 0 },
  ]);
});

void test("encodeTuning emits compact dotted strings for plain string arrays", () => {
  assert.equal(encodeTuning(["E", "B", "G", "D", "A", "E"]), "E.B.G.D.A.E");
});

void test("encodeTuning falls back to JSON for unsafe compact tokens", () => {
  assert.equal(encodeTuning(["E.", "B", "G"]), '["E.","B","G"]');
  assert.equal(encodeTuning(["E%2", "B", "G"]), '["E%2","B","G"]');
  assert.equal(encodeTuning(["", "B", "G"]), '["","B","G"]');
});

void test("parseSharePayload accepts compact and JSON tuning query values", () => {
  const compact = parseSharePayload(new URLSearchParams("tn=E.B.G.D.A.E"));
  const legacy = parseSharePayload(
    new URLSearchParams(
      "tn=%5B%22E%22%2C%22B%22%2C%22G%22%2C%22D%22%2C%22A%22%2C%22E%22%5D",
    ),
  );

  assert.deepEqual(compact?.values.tuning, ["E", "B", "G", "D", "A", "E"]);
  assert.deepEqual(legacy?.values.tuning, ["E", "B", "G", "D", "A", "E"]);
});

void test("tuning round-trip remains stable for compact and object-based tunings", () => {
  const compactParams = serializeSharePayload({
    version: 1,
    values: { tuning: ["E", "B", "G", "D", "A", "E"] },
  });
  const compactParsed = parseSharePayload(compactParams);
  assert.deepEqual(compactParsed?.values.tuning, [
    "E",
    "B",
    "G",
    "D",
    "A",
    "E",
  ]);

  const objectParams = serializeSharePayload({
    version: 1,
    values: { tuning: [{ note: "E2", startFret: 0 }] },
  });
  const objectParsed = parseSharePayload(objectParams);
  assert.deepEqual(objectParsed?.values.tuning, [{ note: "E2", startFret: 0 }]);
});

void test("unsafe tuning tokens round-trip losslessly via JSON fallback", () => {
  const unsafeDotParams = serializeSharePayload({
    version: 1,
    values: { tuning: ["E.", "B", "G"] },
  });
  assert.equal(unsafeDotParams.get("tn"), '["E.","B","G"]');
  const unsafeDotParsed = parseSharePayload(unsafeDotParams);
  assert.deepEqual(unsafeDotParsed?.values.tuning, ["E.", "B", "G"]);

  const unsafePercentParams = serializeSharePayload({
    version: 1,
    values: { tuning: ["E%2", "B", "G"] },
  });
  assert.equal(unsafePercentParams.get("tn"), '["E%2","B","G"]');
  const unsafePercentParsed = parseSharePayload(unsafePercentParams);
  assert.deepEqual(unsafePercentParsed?.values.tuning, ["E%2", "B", "G"]);
});

void test("parseSharePayload ignores unknown/unsupported keys", () => {
  const parsed = parseSharePayload(
    new URLSearchParams("sys=bad-system&str=-99&fr=1000&lefty=1&show=names"),
  );

  assert.ok(parsed);
  assert.equal(parsed?.values.systemId, undefined);
  assert.equal(parsed?.values.strings, 4);
  assert.equal(parsed?.values.frets, 30);
  assert.equal((parsed?.values as Record<string, unknown>).lefty, undefined);
});

void test("parseSharePayload resolves canonical nm=fretless", () => {
  const parsed = parseSharePayload(new URLSearchParams("nm=fretless"));
  assert.equal(parsed?.values.neckFilterMode, "fretless");
});

void test("parseSharePayload resolves canonical nm=kg", () => {
  const parsed = parseSharePayload(new URLSearchParams("nm=kg"));
  assert.equal(parsed?.values.neckFilterMode, "kg");
});

void test("parseSharePayload resolves canonical nm=none", () => {
  const parsed = parseSharePayload(new URLSearchParams("nm=none"));
  const resolved = resolveInstrumentHydrationValues(parsed);
  assert.equal(resolved?.neckFilterMode, "none");
});

void test("parseSharePayload coerces invalid nm to none", () => {
  const parsed = parseSharePayload(new URLSearchParams("nm=legacy"));
  const resolved = resolveInstrumentHydrationValues(parsed);
  assert.equal(resolved?.neckFilterMode, "none");
});

void test("parseSharePayload preserves pack references/payload", () => {
  const parsed = parseSharePayload(
    new URLSearchParams(
      "pn=My%20Shared%20Pack&pid=pack-123&pv=1&pp=%7B%22name%22%3A%22My%20Shared%20Pack%22%2C%22system%22%3A%7B%22edo%22%3A24%7D%2C%22tuning%22%3A%7B%22strings%22%3A%5B%7B%22note%22%3A%22C%22%7D%5D%7D%7D",
    ),
  );

  assert.ok(parsed);
  assert.equal(parsed?.values.presetName, "My Shared Pack");
  assert.equal(parsed?.values.packId, "pack-123");
  assert.equal(parsed?.values.packPayloadVersion, 1);
  assert.equal(
    (parsed?.values.packPayload as Record<string, unknown>)?.name,
    "My Shared Pack",
  );
});

void test("resolveInstrumentHydrationValues fills deterministic defaults", () => {
  const parsed = parseSharePayload(new URLSearchParams("v=1"));
  const resolved = resolveInstrumentHydrationValues(parsed);

  assert.ok(resolved);
  assert.equal(resolved?.systemId, "12-TET");
  assert.equal(resolved?.strings, 6);
  assert.equal(resolved?.frets, 24);
  assert.deepEqual(resolved?.tuning, []);
  assert.equal(resolved?.stringMeta, null);
  assert.equal(resolved?.boardMeta, null);
  assert.equal(resolved?.neckFilterMode, "none");
});

void test("parseSharePayload no longer accepts legacy alias keys", () => {
  const parsed = parseSharePayload(
    new URLSearchParams("system=24-TET&strings=7&frets=22&preset=Legacy"),
  );
  assert.equal(parsed, null);
});
