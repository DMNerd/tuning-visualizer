import test from "node:test";
import assert from "node:assert/strict";

import {
  toGermanNoteName,
  germanToEnglishNoteName,
  renderNoteName,
  buildNoteAliases,
} from "@/lib/theory/noteNaming";

test("german note naming converts B and H correctly", () => {
  assert.equal(toGermanNoteName("Bb"), "B");
  assert.equal(toGermanNoteName("B"), "H");
  assert.equal(toGermanNoteName("A#"), "Ais");
  assert.equal(toGermanNoteName("Eb"), "Es");
});

test("german note naming supports double accidentals", () => {
  assert.equal(toGermanNoteName("C##"), "Cisis");
  assert.equal(toGermanNoteName("Cbb"), "Ceses");
  assert.equal(toGermanNoteName("Bbb"), "Heses");
});

test("german parsing resolves aliases back to english spellings", () => {
  assert.equal(germanToEnglishNoteName("H"), "B");
  assert.equal(germanToEnglishNoteName("B"), "Bb");
  assert.equal(germanToEnglishNoteName("Fis"), "F#");
  assert.equal(germanToEnglishNoteName("Es"), "Eb");
});

test("german microtonal suffixes map to arrows", () => {
  assert.equal(toGermanNoteName("C↑"), "Cih");
  assert.equal(toGermanNoteName("C#↑"), "Cisih");
  assert.equal(toGermanNoteName("Db↓"), "Deseh");
  assert.equal(germanToEnglishNoteName("Hih"), "B↑");
  assert.equal(germanToEnglishNoteName("Aisih"), "A#↑");
  assert.equal(germanToEnglishNoteName("Aeh"), "A↓");
});

test("renderNoteName keeps english by default and supports german", () => {
  assert.equal(renderNoteName("B"), "B");
  assert.equal(renderNoteName("B", "german"), "H");
});

test("buildNoteAliases includes english and german variants", () => {
  const aliases = buildNoteAliases("Bb");
  assert.equal(aliases.has("Bb"), true);
  assert.equal(aliases.has("B"), true);
});

test("buildNoteAliases includes microtonal german variants", () => {
  const aliases = buildNoteAliases("C#↑");
  assert.equal(aliases.has("C#↑"), true);
  assert.equal(aliases.has("Cisih"), true);
});
