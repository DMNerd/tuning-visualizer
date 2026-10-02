import test from "node:test";
import assert from "node:assert/strict";

import {
  buildChordPCsFromPc,
  chordLabel,
  chordTypesFor,
  isChordTypeOffered,
  isMicrotonalChordType,
  migrateChordType,
} from "@domain/theory/chords";

const sort = (arr) => [...arr].sort((a, b) => a - b);

test("buildChordPCsFromPc wraps pitch classes for 12-TET", () => {
  const pcs = buildChordPCsFromPc(10, "m", 12);
  assert.deepEqual(sort(pcs), [1, 5, 10]);
});

test("buildChordPCsFromPc wraps pitch classes for 24-TET", () => {
  const pcs = buildChordPCsFromPc(23, "M", 24);
  assert.deepEqual(sort(pcs), [7, 13, 23]);
});

test("chord types are the theory engine's, per EDO", () => {
  const types12 = chordTypesFor(12);
  assert.ok(types12.includes("maj7"));
  assert.ok(types12.includes("7sus4no5"));
  assert.ok(types12.length > 100);
  assert.ok(!types12.includes("(↓3)"));
  assert.ok(chordTypesFor(24).includes("(↓3)"));
  assert.ok(chordTypesFor(72).includes("har7"));
  const labels = types12.map((type) => chordLabel(type, 12));
  assert.deepEqual(
    labels,
    [...labels].sort((a, b) => a.localeCompare(b)),
  );
});

test("labels", () => {
  assert.equal(chordLabel("maj7"), "Major Seventh · maj7");
  assert.equal(chordLabel("(↓3)"), "Downmajor · (↓3)");
  assert.equal(chordLabel("har7", 72), "Harmonic Seventh · har7");
  // Tonal's unnamed chords show their symbol
  assert.equal(chordLabel("Madd9"), "Madd9");
});

test("microtonal chords sound as their 12-TET stand-in where not offered", () => {
  assert.ok(isMicrotonalChordType("(↓3)"));
  assert.ok(isMicrotonalChordType("har7"));
  assert.ok(!isMicrotonalChordType("m7"));
  assert.ok(!isChordTypeOffered("(↓3)", 12));
  assert.deepEqual(sort(buildChordPCsFromPc(0, "(↓3)", 12)), [0, 4, 7]);
  assert.deepEqual(sort(buildChordPCsFromPc(0, "(↓3)", 24)), [0, 7, 14]);
});

test("migrateChordType maps gv's old chord types", () => {
  assert.equal(migrateChordType("maj"), "M");
  assert.equal(migrateChordType("neut7"), "7(↓3)");
  assert.equal(migrateChordType("quartal"), "7sus4no5");
  assert.equal(migrateChordType("m7b5"), "m7b5");
  // every old type is a chord type gv offers
  const old = ["maj", "min", "dim", "aug", "sus2", "sus4", "6", "m6", "7"];
  old.push("maj7", "m7", "m7b5", "dim7", "add9", "quartal");
  for (const type of old) {
    assert.ok(isChordTypeOffered(migrateChordType(type), 12), type);
  }
  for (const type of ["neut", "neut7", "sus2↓", "sus4↑", "maj↑3", "min↓3"]) {
    assert.ok(isChordTypeOffered(migrateChordType(type), 24), type);
  }
});
