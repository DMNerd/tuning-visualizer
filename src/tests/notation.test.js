import test from "node:test";
import assert from "node:assert/strict";
import {
  SPELLING_MARKER_ALIASES,
  normalizeSpellingHint,
  normalizeSpellingMarker,
  normalizeIntlNoteName,
  resolveSpellingMarker,
} from "@/lib/theory/notation";

test("every configured spelling alias resolves to a canonical marker", () => {
  for (const [alias, canonical] of Object.entries(SPELLING_MARKER_ALIASES)) {
    assert.equal(
      resolveSpellingMarker(alias),
      canonical,
      `alias '${alias}' should resolve to '${canonical}'`,
    );
  }
});

test("spelling marker normalization canonicalizes separators and casing", () => {
  assert.equal(normalizeSpellingMarker("  DE-H/B  "), "de h/b");
  assert.equal(normalizeSpellingMarker("de_h/b"), "de h/b");
  assert.equal(normalizeSpellingMarker("de   h   b"), "de h b");
});

test("normalizeIntlNoteName trims input and preserves token when translation is off", () => {
  assert.equal(
    normalizeIntlNoteName("  Aisih  ", { translateGerman: false }),
    "Aisih",
  );
});

test("normalizeIntlNoteName translates germanic/czech spellings when enabled", () => {
  assert.equal(normalizeIntlNoteName("H", { translateGerman: true }), "B");
  assert.equal(normalizeIntlNoteName("B", { translateGerman: true }), "Bb");
  assert.equal(normalizeIntlNoteName("Hih", { translateGerman: true }), "B↑");
});

test("normalizeIntlNoteName falls back to trimmed unknown token", () => {
  assert.equal(
    normalizeIntlNoteName("  NotANote  ", { translateGerman: true }),
    "NotANote",
  );
});

test("normalizeSpellingHint trims and preserves non-empty hints exactly", () => {
  assert.equal(normalizeSpellingHint("  de-h/b  "), "de-h/b");
  assert.equal(normalizeSpellingHint("czech"), "czech");
});

test("normalizeSpellingHint drops empty/invalid values", () => {
  assert.equal(normalizeSpellingHint("   "), undefined);
  assert.equal(normalizeSpellingHint(null), undefined);
  assert.equal(normalizeSpellingHint(undefined), undefined);
});
