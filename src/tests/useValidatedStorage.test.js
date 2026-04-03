import test from "node:test";
import assert from "node:assert/strict";

import {
  coerceWithFallback,
  resolveNextValue,
} from "@/hooks/validatedStorageUtils";
import { clamp } from "@/utils/math";

const numberInRange = (min, max, fallback) => (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clamp(value, min, max);
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return clamp(parsed, min, max);
    }
  }
  return fallback;
};

test("coerceWithFallback returns fallback for invalid stored values", () => {
  const coerce = numberInRange(4, 8, 6);

  assert.equal(coerceWithFallback(undefined, 6, coerce), 6);
  assert.equal(coerceWithFallback("not-a-number", 6, coerce), 6);
  assert.equal(coerceWithFallback("5", 6, coerce), 5);
  assert.equal(coerceWithFallback(20, 6, coerce), 8);
});

test("resolveNextValue supports functional updaters with validation", () => {
  const coerce = numberInRange(4, 8, 6);

  const nextFromFn = resolveNextValue((prev) => prev + 10, 5, 6, coerce);
  assert.equal(nextFromFn, 8);

  const invalidFromFn = resolveNextValue(() => null, 5, 6, coerce);
  assert.equal(invalidFromFn, 6);

  const nextFromValue = resolveNextValue("7", 5, 6, coerce);
  assert.equal(nextFromValue, 7);
});
