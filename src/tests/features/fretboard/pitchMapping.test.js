import test from "node:test";
import assert from "node:assert/strict";

import { TUNINGS, findSystemByEdo } from "@domain/theory/tuning";
import {
  buildNameToPcMap,
  nameForPcWithDisplayAccidentals,
  resolvePcForName,
} from "@features/fretboard/hooks/usePitchMapping";

test("german naming keeps B/H pitch classes distinct", () => {
  const map = buildNameToPcMap(TUNINGS["12-TET"], "german", "flat");

  assert.equal(map.get("B"), 10);
  assert.equal(map.get("H"), 11);
});

test("german naming keeps B/H parsing stable even in sharp accidental mode", () => {
  const map = buildNameToPcMap(TUNINGS["12-TET"], "german", "sharp");

  assert.equal(map.get("B"), 10);
  assert.equal(map.get("H"), 11);
});

test("english naming still treats B as pitch class 11", () => {
  const map = buildNameToPcMap(TUNINGS["12-TET"], "english", "sharp");

  assert.equal(map.get("B"), 11);
});

test("both accidental display emits slash names while preserving natural notes", () => {
  const system = TUNINGS["12-TET"];

  assert.equal(nameForPcWithDisplayAccidentals(system, 6, "both"), "F#/Gb");
  assert.equal(nameForPcWithDisplayAccidentals(system, 0, "both"), "C");
});

test("resolvePcForName keeps parsing names saved under older naming", () => {
  const system24 = TUNINGS["24-TET"];
  const map24 = buildNameToPcMap(system24, "english", "flat");
  // pre-D2 flat names, now displayed as D↓ and E↓
  assert.equal(resolvePcForName(map24, "Db↑", 24), 3);
  assert.equal(resolvePcForName(map24, "Eb↑", 24), 7);
  assert.equal(resolvePcForName(map24, "Desih", 24), 3);
  // ASCII ups/downs and double accidentals
  assert.equal(resolvePcForName(map24, "^C#", 24), 3);
  assert.equal(resolvePcForName(map24, "C##", 24), 4);

  const system19 = findSystemByEdo(TUNINGS, 19).system;
  const map19 = buildNameToPcMap(system19, "english", "sharp");
  // custom EDOs used to be named N0..N18
  assert.equal(resolvePcForName(map19, "N5", 19), 5);
  assert.equal(resolvePcForName(map19, "N19", 19), 0);
  assert.equal(resolvePcForName(map19, "nonsense", 19), 0);
});

test("custom EDOs get spelled note names", () => {
  const system19 = findSystemByEdo(TUNINGS, 19).system;
  assert.equal(nameForPcWithDisplayAccidentals(system19, 2, "sharp"), "Db");
  assert.equal(nameForPcWithDisplayAccidentals(system19, 7, "both"), "E#/Fb");
});
