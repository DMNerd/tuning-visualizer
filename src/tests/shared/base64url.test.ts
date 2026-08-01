import test from "node:test";
import assert from "node:assert/strict";

import { decodeBase64Url, encodeBase64Url } from "@shared/lib/base64url";

void test("base64url round-trips ASCII strings", () => {
  const input = "hello world, this is a routine token";
  assert.equal(decodeBase64Url(encodeBase64Url(input)), input);
});

void test("base64url round-trips unicode/emoji strings", () => {
  const input = "7/4 groove ↑ 𝄞 🎸 café";
  assert.equal(decodeBase64Url(encodeBase64Url(input)), input);
});

void test("base64url round-trips the empty string", () => {
  const encoded = encodeBase64Url("");
  assert.equal(encoded, "");
});

void test("base64url output is URL-safe (no +, /, or = padding)", () => {
  // A byte sequence chosen to reliably produce +/= in standard base64.
  const input = "ûÿûÿûÿ";
  const encoded = encodeBase64Url(input);
  assert.equal(/[+/=]/.test(encoded), false);
  assert.equal(decodeBase64Url(encoded), input);
});

void test("decodeBase64Url returns null for malformed input, never throws", () => {
  assert.equal(decodeBase64Url("not-valid-base64!!!"), null);
  assert.equal(decodeBase64Url(""), null);
  assert.equal(decodeBase64Url(null as unknown as string), null);
});
