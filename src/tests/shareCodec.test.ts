import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSharePayload,
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
        kgNeckFilterEnabled: false,
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
  assert.equal(payload.values.kgNeckFilterEnabled, undefined);
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
      tuning: [{ note: "E2", startFret: 0 }],
      kgNeckFilterEnabled: true,
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
  assert.equal(params.get("kg"), "1");
  assert.equal(params.get("pn"), "My Shared Pack");
  assert.equal(params.get("pid"), "pack-123");
  assert.equal(params.get("pv"), "1");
  assert.equal(
    params.get("pp"),
    '{"name":"My Shared Pack","system":{"edo":24},"tuning":{"strings":[{"note":"C"}]}}',
  );
  assert.equal(params.get("tn"), '[{"note":"E2","startFret":0}]');
});

void test("parseSharePayload ignores unknown/unsupported keys", () => {
  const parsed = parseSharePayload(
    new URLSearchParams(
      "sys=bad-system&str=-99&fr=1000&lefty=1&show=names&kg=0",
    ),
  );

  assert.ok(parsed);
  assert.equal(parsed?.values.systemId, undefined);
  assert.equal(parsed?.values.strings, 4);
  assert.equal(parsed?.values.frets, 30);
  assert.equal(parsed?.values.kgNeckFilterEnabled, undefined);
  assert.equal((parsed?.values as Record<string, unknown>).lefty, undefined);
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
  assert.equal(resolved?.kgNeckFilterEnabled, false);
});

void test("parseSharePayload no longer accepts legacy alias keys", () => {
  const parsed = parseSharePayload(
    new URLSearchParams("system=24-TET&strings=7&frets=22&preset=Legacy"),
  );
  assert.equal(parsed, null);
});
