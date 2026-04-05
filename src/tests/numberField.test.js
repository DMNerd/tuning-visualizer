import test from "node:test";
import assert from "node:assert/strict";
import { commitNumberField } from "@/hooks/useNumberField";

test("commitNumberField submits valid in-range values", () => {
  let error = "";
  let text = "";
  let submitted = null;

  const ok = commitNumberField({
    textValue: "42",
    min: 20,
    max: 300,
    setError: (value) => {
      error = value;
    },
    setText: (value) => {
      text = value;
    },
    onSubmit: (value) => {
      submitted = value;
    },
  });

  assert.equal(ok, true);
  assert.equal(submitted, 42);
  assert.equal(text, "42");
  assert.equal(error, "");
});

test("commitNumberField rejects invalid numeric input", () => {
  let error = "";
  let submitted = null;

  const ok = commitNumberField({
    textValue: "abc",
    min: 1,
    max: 10,
    setError: (value) => {
      error = value;
    },
    setText: () => {},
    onSubmit: (value) => {
      submitted = value;
    },
  });

  assert.equal(ok, false);
  assert.equal(submitted, null);
  assert.equal(error, "Please enter a number between 1 and 10.");
});

test("commitNumberField clamps out-of-range values and reports adjustment", () => {
  let error = "";
  let text = "";
  let submitted = null;

  const ok = commitNumberField({
    textValue: "500",
    min: 20,
    max: 300,
    setError: (value) => {
      error = value;
    },
    setText: (value) => {
      text = value;
    },
    onSubmit: (value) => {
      submitted = value;
    },
  });

  assert.equal(ok, true);
  assert.equal(submitted, 300);
  assert.equal(text, "300");
  assert.equal(error, "Allowed range is 20–300. Adjusted to 300.");
});

test("commitNumberField accepts rawOverride for keyed commits", () => {
  let submitted = null;

  const ok = commitNumberField({
    rawOverride: 9,
    textValue: "1",
    min: 1,
    max: 12,
    setError: () => {},
    setText: () => {},
    onSubmit: (value) => {
      submitted = value;
    },
  });

  assert.equal(ok, true);
  assert.equal(submitted, 9);
});
