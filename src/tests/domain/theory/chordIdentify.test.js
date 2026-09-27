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

test("identifyChord ignores pick order for the pitch set but uses first pick as bass", () => {
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
});

test("identifyChord accepts voicings without the fifth", () => {
  const [best] = identifyChord(pcs("C", "E", "A#"), 12);
  assert.equal(formatChordSymbol(best, nameForPc), "C7(no5)");
  assert.equal(best.omitsFifth, true);
});

test("identifyChord prefers complete formulas over no-5th readings", () => {
  // C F A# is exactly C quartal; C7sus4(no5) would be the same notes.
  const found = identifyChord(pcs("C", "F", "A#"), 12);
  assert.equal(found[0].omitsFifth, false);
  assert.ok(found.every((m) => m.id !== "7sus4"));
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
  const [neutral] = identifyChord([0, 7, 14], 24);
  assert.equal(neutral.appType, "neut");
  const [major] = identifyChord([0, 8, 14], 24);
  assert.equal(major.appType, "maj");
});

test("identifyChord does not report microtonal types outside 24-EDO", () => {
  const found = identifyChord(pcs("C", "E", "G"), 12);
  assert.ok(found.every((m) => m.id !== "neut" && m.id !== "maj↑3"));
});

test("identifyChord projects formulas into other EDOs", () => {
  // 19-EDO major triad: 0, 6, 11.
  const [best] = identifyChord([0, 6, 11], 19);
  assert.equal(best.id, "maj");
});
