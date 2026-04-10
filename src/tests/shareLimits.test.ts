import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateShareUrlSize,
  SHARE_URL_QR_HARD_LIMIT_THRESHOLD,
  SHARE_URL_WARNING_THRESHOLD,
} from "@/lib/url/shareLimits";

void test("evaluateShareUrlSize returns healthy status under warning threshold", () => {
  const value = evaluateShareUrlSize("x".repeat(SHARE_URL_WARNING_THRESHOLD));

  assert.equal(value.length, SHARE_URL_WARNING_THRESHOLD);
  assert.equal(value.warn, false);
  assert.equal(value.allowQr, true);
  assert.equal(value.reasonCode, "none");
});

void test("evaluateShareUrlSize warns above warning threshold but allows QR", () => {
  const value = evaluateShareUrlSize(
    "x".repeat(SHARE_URL_WARNING_THRESHOLD + 1),
  );

  assert.equal(value.warn, true);
  assert.equal(value.allowQr, true);
  assert.equal(value.reasonCode, "warning-threshold");
  assert.match(value.message ?? "", /long/i);
});

void test("evaluateShareUrlSize disallows QR above hard limit", () => {
  const value = evaluateShareUrlSize(
    "x".repeat(SHARE_URL_QR_HARD_LIMIT_THRESHOLD + 1),
  );

  assert.equal(value.warn, true);
  assert.equal(value.allowQr, false);
  assert.equal(value.reasonCode, "qr-hard-limit");
  assert.match(value.message ?? "", /hard limit/i);
});
