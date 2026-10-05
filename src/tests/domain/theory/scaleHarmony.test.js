import test from "node:test";
import assert from "node:assert/strict";

import { scalesForSystem } from "@domain/theory/scales";
import { identifyScales } from "@domain/theory/scaleIdentify";
import { chordsInScale, modesOfScale } from "@domain/theory/scaleHarmony";
import {
  ascendingFrequencies,
  chordFrequencies,
} from "@domain/theory/playback";

const options12 = scalesForSystem("12-TET", 12);
const options24 = scalesForSystem("24-TET", 24);
const scale = (options, label) => options.find((s) => s.label === label);

test("identifyScales lists exact matches first", () => {
  const [best, ...rest] = identifyScales([0, 2, 4, 5, 7, 9, 11], 12, options12);
  assert.deepEqual(best, {
    rootPc: 0,
    label: "Major",
    exact: true,
    extraNotes: 0,
  });
  assert.ok(rest.every((match) => match.exact));
});

test("identifyScales prefers seven-note scales on the first pick", () => {
  const labels = identifyScales([0, 4, 7, 11], 12, options12).map(
    ({ rootPc, label }) => `${rootPc} ${label}`,
  );
  assert.deepEqual(labels.slice(0, 2), ["0 Major", "0 Lydian"]);
  assert.deepEqual(identifyScales([0, 4], 12, options12), []);
});

test("identifyScales finds maqamat in 24-EDO", () => {
  const [best] = identifyScales([0, 4, 7, 10, 14, 18, 21], 24, options24);
  assert.equal(best.label, "Rast");
});

test("chordsInScale gives the chords of each degree", () => {
  const chords = chordsInScale(0, scale(options12, "Major").pcs, 12);
  assert.deepEqual(
    chords.map(({ types }) => types[0]),
    ["M", "m", "m", "M", "M", "m", "dim"],
  );
  assert.deepEqual(chords[4].types, ["M", "7", "6"]);
});

test("modesOfScale names the other modes", () => {
  assert.deepEqual(
    modesOfScale(scale(options12, "Major"), 0, 12, options12).map(
      ({ label }) => label,
    ),
    ["Dorian", "Phrygian", "Lydian", "Mixolydian", "Minor", "Locrian"],
  );
  assert.deepEqual(modesOfScale(scale(options24, "Rast"), 0, 24, options24), [
    { rootPc: 4, label: "Husayni" },
    { rootPc: 7, label: "Sikah" },
    { rootPc: 14, label: "Nairuz" },
    { rootPc: 21, label: "Iraq" },
  ]);
  assert.deepEqual(
    modesOfScale(scale(options12, "Chromatic"), 0, 12, options12),
    [],
  );
});

test("ascendingFrequencies plays upwards in the EDO", () => {
  const round = (freqs) => freqs.map((f) => Math.round(f * 10) / 10);
  assert.deepEqual(
    round(ascendingFrequencies([0, 4, 7, 0], 12)),
    [261.6, 329.6, 392, 523.3],
  );
  // 24-EDO E↓4, a quarter tone below E4
  assert.deepEqual(round(ascendingFrequencies([7], 24)), [320.2]);
  // the tuning's reference pitch
  assert.deepEqual(round(ascendingFrequencies([9], 12, 432)), [432]);
});

test("chordFrequencies voices a chord upwards from its root", () => {
  const round = (freqs) => freqs.map((f) => Math.round(f * 10) / 10);
  // G major (G B D) below middle C, root first
  assert.deepEqual(
    round(chordFrequencies(7, [2, 7, 11], 12)),
    [196, 246.9, 293.7],
  );
});

test("chordsInScale names each degree with a quality-aware numeral", () => {
  const numerals = (options, label, edo) =>
    chordsInScale(0, scale(options, label).pcs, edo).map((d) => d.numeral);
  assert.deepEqual(
    numerals(options12, "Major", 12),
    "I ii iii IV V vi vii°".split(" "),
  );
  assert.deepEqual(
    numerals(options12, "Minor", 12),
    "i ii° ♭III iv v ♭VI ♭VII".split(" "),
  );
  // the augmented triad on the third, not m#5 (a major triad on E)
  assert.deepEqual(
    numerals(options12, "Harmonic Minor", 12),
    "i ii° ♭III+ iv V ♭VI vii°".split(" "),
  );
  // rast's neutral degrees keep their arrows
  assert.deepEqual(
    numerals(options24, "Rast", 24),
    "I ii ↑♭III IV V VI ↑♭VII".split(" "),
  );
});
