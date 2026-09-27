import test from "node:test";
import assert from "node:assert/strict";

import {
  formatChordName,
  formatChordSymbol,
  identifyChord,
} from "@domain/theory/chordIdentify";

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const nameForPc = (pc) => NAMES[pc];
const pcs = (...names) => names.map((n) => NAMES.indexOf(n));
const symbols = (matches) =>
  matches.map((m) => formatChordSymbol(m, nameForPc));

test("identifyChord names basic triads in root position", () => {
  assert.equal(symbols(identifyChord(pcs("C", "E", "G"), 12))[0], "C");
  assert.equal(symbols(identifyChord(pcs("A", "C", "E"), 12))[0], "Am");
  assert.equal(symbols(identifyChord(pcs("B", "D", "F"), 12))[0], "Bdim");
});

test("identifyChord uses the first pick as bass and prefers common chords", () => {
  // E C G is a first-inversion C major, not the rare "Em#5"
  const [best] = identifyChord(pcs("E", "C", "G"), 12);
  assert.equal(formatChordSymbol(best, nameForPc), "C/E");
  assert.equal(formatChordName(best, nameForPc), "C major, over E");
});

test("identifyChord honours an explicit bass", () => {
  const [best] = identifyChord(pcs("C", "E", "G"), 12, NAMES.indexOf("G"));
  assert.equal(formatChordSymbol(best, nameForPc), "C/G");
});

test("identifyChord lists alternate interpretations of ambiguous sets", () => {
  const found = symbols(identifyChord(pcs("C", "E", "G", "A"), 12));
  assert.equal(found[0], "C6");
  assert.ok(found.includes("Am7/C"));

  const fromA = symbols(identifyChord(pcs("A", "C", "E", "G"), 12));
  assert.equal(fromA[0], "Am7");
  assert.ok(fromA.includes("C6/A"));
});

test("identifyChord maps library chords back to app chord types", () => {
  const [best] = identifyChord(pcs("G", "B", "D", "F"), 12);
  assert.equal(best.appType, "7");
  const [ninth] = identifyChord(pcs("G", "B", "D", "F", "A"), 12);
  assert.equal(formatChordSymbol(ninth, nameForPc), "G9");
  assert.equal(ninth.appType, null);
  // inversions map to the type of their own root
  const [firstInversion] = identifyChord(pcs("E", "C", "G"), 12);
  assert.equal(firstInversion.appType, "maj");
});

test("identifyChord names voicings without the fifth", () => {
  const [best] = identifyChord(pcs("C", "E", "A#"), 12);
  assert.equal(formatChordSymbol(best, nameForPc), "C7no5");
});

test("identifyChord recognises power chords and rejects bare intervals", () => {
  assert.equal(symbols(identifyChord(pcs("E", "B"), 12))[0], "E5");
  assert.deepEqual(identifyChord(pcs("C", "E"), 12), []);
  assert.deepEqual(identifyChord(pcs("C"), 12), []);
});

test("identifyChord dedupes and wraps pitch classes", () => {
  const [best] = identifyChord([0, 12, 4, 7, -5], 12);
  assert.equal(formatChordSymbol(best, nameForPc), "C");
});

test("identifyChord finds microtonal chords in 24-EDO", () => {
  const names24 = (pc) => `pc${pc}`;
  const [neutral] = identifyChord([0, 7, 14], 24);
  assert.equal(neutral.appType, "neut");
  assert.equal(formatChordSymbol(neutral, names24), "pc0(↓3)");
  assert.equal(neutral.name, "downmajor");
  assert.equal(identifyChord([0, 7, 14, 20], 24)[0].appType, "neut7");
  assert.equal(identifyChord([0, 9, 14], 24)[0].appType, "maj↑3");
  assert.equal(identifyChord([0, 5, 14], 24)[0].appType, "min↓3");
  const [major] = identifyChord([0, 8, 14], 24);
  assert.equal(major.appType, "maj");
});

test("identifyChord does not report microtonal chords in 12-EDO", () => {
  const found = identifyChord(pcs("C", "E", "G"), 12);
  assert.ok(found.every((m) => !/[↑↓]/.test(m.id)));
});

test("identifyChord works in other EDOs", () => {
  // 19-EDO major triad: 0, 6, 11
  const [best] = identifyChord([0, 6, 11], 19);
  assert.equal(best.suffix, "");
  assert.equal(best.appType, "maj");
  // 31-EDO neutral triad: 0, 9, 18
  const [neutral] = identifyChord([0, 9, 18], 31);
  assert.equal(neutral.id, "(↓3)");
});

test("identifyChord rejects invalid divisions", () => {
  assert.deepEqual(identifyChord([0, 4, 7], 0), []);
  assert.deepEqual(identifyChord([0, 4, 7], 12.5), []);
});

test("identifyChord spells each chord tone as an interval above the root", () => {
  const [neutral] = identifyChord([0, 7, 14], 24);
  assert.deepEqual(neutral.degrees, { 0: "1P", 7: "↓3M", 14: "5P" });
  const [firstInversion] = identifyChord(pcs("E", "C", "G"), 12);
  assert.deepEqual(firstInversion.degrees, { 0: "1P", 4: "3M", 7: "5P" });
});
