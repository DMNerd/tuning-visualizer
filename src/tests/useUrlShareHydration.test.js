import test from "node:test";
import assert from "node:assert/strict";

import {
  areShareDomainsHydrated,
  clearUrlSearchParams,
  evaluateUrlShareNoticeState,
  shouldApplyUrlHydration,
} from "@/app/hooks/useUrlShareHydration";
import {
  parseSharePayload,
  resolveInstrumentHydrationValues,
} from "@/lib/url/shareCodec";

void test("areShareDomainsHydrated requires theory + instrument hydration only", () => {
  assert.equal(
    areShareDomainsHydrated({
      theoryHydrated: true,
      instrumentHydrated: true,
    }),
    true,
  );

  assert.equal(
    areShareDomainsHydrated({
      theoryHydrated: true,
      instrumentHydrated: false,
    }),
    false,
  );
});

void test("shouldApplyUrlHydration models rehydrate race safely", () => {
  const payload = { values: { root: "D" } };

  // Initial mount parse may happen before persisted stores finish hydration.
  assert.equal(
    shouldApplyUrlHydration({
      parsedOnce: true,
      appliedOnce: false,
      hydrationReady: false,
      payload,
    }),
    false,
  );

  // Once hydration is ready, payload applies exactly once.
  assert.equal(
    shouldApplyUrlHydration({
      parsedOnce: true,
      appliedOnce: false,
      hydrationReady: true,
      payload,
    }),
    true,
  );

  // After application, one-time guards prevent repeat apply.
  assert.equal(
    shouldApplyUrlHydration({
      parsedOnce: true,
      appliedOnce: true,
      hydrationReady: true,
      payload,
    }),
    false,
  );
});

void test("instrument hydration defaults converge recipient divergent state", () => {
  const recipient = {
    systemId: "24-TET",
    strings: 8,
    frets: 30,
    neckFilterMode: "kg",
  };

  const payload = parseSharePayload(new URLSearchParams("v=1"));
  const resolved = resolveInstrumentHydrationValues(payload);
  assert.ok(resolved);

  const applied = {
    ...recipient,
    ...resolved,
  };

  assert.equal(applied.systemId, "12-TET");
  assert.equal(applied.strings, 6);
  assert.equal(applied.frets, 24);
  assert.equal(applied.neckFilterMode, "none");
});

void test("instrument hydration resolves fretless neck filter mode from URL payload", () => {
  const payload = parseSharePayload(new URLSearchParams("nm=fretless"));
  const resolved = resolveInstrumentHydrationValues(payload);
  assert.equal(resolved?.neckFilterMode, "fretless");
});

void test("evaluateUrlShareNoticeState distinguishes valid/invalid/none", () => {
  assert.equal(
    evaluateUrlShareNoticeState({
      hasSearch: false,
      payload: { values: { strings: 7 } },
    }),
    "none",
  );
  assert.equal(
    evaluateUrlShareNoticeState({
      hasSearch: true,
      payload: { values: { strings: 7 } },
    }),
    "valid",
  );
  assert.equal(
    evaluateUrlShareNoticeState({
      hasSearch: true,
      payload: null,
    }),
    "invalid",
  );
});

void test("clearUrlSearchParams strips query string via history.replaceState", () => {
  const originalWindow = globalThis.window;
  const replaceCalls = [];
  globalThis.window = {
    location: { href: "https://example.test/app?sys=24-TET&str=7#board" },
    history: {
      state: { test: true },
      replaceState: (...args) => {
        replaceCalls.push(args);
      },
    },
  };

  try {
    clearUrlSearchParams();
    assert.equal(replaceCalls.length, 1);
    assert.equal(replaceCalls[0][2], "https://example.test/app#board");
  } finally {
    if (typeof originalWindow === "undefined") {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
});
