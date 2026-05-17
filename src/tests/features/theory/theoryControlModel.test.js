import test from "node:test";
import assert from "node:assert/strict";

import { buildTheoryControlModel } from "@shared/lib/controlModels";
import { resolveCapoRelativeChordRootPc } from "@domain/theory/capoChords";
import { buildChordFit } from "@features/theory/model/theoryPanelModel";

test("buildTheoryControlModel carries canonical chord PC set names", () => {
  const chordTonePcs = new Set([0, 4, 7]);
  const chordOverlayPcs = new Set([0, 4, 7]);

  const model = buildTheoryControlModel({
    system: {
      system: { divisions: 12 },
      sysNames: ["C", "D", "E", "F", "G", "A", "B"],
      nameForPc: (pc) => `N${pc}`,
      rootIx: 0,
    },
    scale: {
      root: "C",
      setRoot: () => {},
      scale: "Major",
      setScale: () => {},
      scaleOptions: [{ label: "Major", pcs: [0, 2, 4, 5, 7, 9, 11] }],
      intervals: [0, 2, 4, 5, 7, 9, 11],
    },
    chord: {
      chordRoot: "C",
      setChordRoot: () => {},
      chordType: "maj",
      setChordType: () => {},
      showChord: true,
      setShowChord: () => {},
      hideNonChord: false,
      setHideNonChord: () => {},
      chordRootIx: 0,
      chordTonePcs,
      chordOverlayPcs,
    },
    randomize: {
      randomizeMode: "both",
      setRandomizeMode: () => {},
      onRandomize: () => {},
    },
    defaults: {
      root: "C",
      scale: "Major",
      chordRoot: "C",
      chordType: "maj",
    },
  });

  assert.equal(model.meta.chordTonePcs, chordTonePcs);
  assert.equal(model.meta.chordOverlayPcs, chordOverlayPcs);
});

test("buildChordFit reports warning and text when tones are outside scale", () => {
  const fit = buildChordFit([0, 4, 7], new Set([0, 4, 10]));

  assert.equal(fit.inScale, 2);
  assert.equal(fit.total, 3);
  assert.equal(fit.outside, 1);
  assert.equal(fit.kind, "warning");
  assert.equal(fit.text, "Chord fit: 2/3 tones in scale");
});

test("buildChordFit handles hidden overlay state without dropping chord tones", () => {
  const chordTonePcs = new Set([0, 4, 7]);
  const hiddenOverlayPcs = null;

  const fit = buildChordFit([0, 2, 4, 5, 7, 9, 11], chordTonePcs);

  assert.equal(hiddenOverlayPcs, null);
  assert.equal(fit.total, 3);
  assert.equal(fit.kind, "success");
  assert.equal(fit.text, "Chord fit: 3/3 tones in scale");
});

test("buildTheoryControlModel transposes capo-relative chord display and sets", () => {
  const chordTonePcs = new Set([0, 4, 7]);
  const chordOverlayPcs = new Set([0, 4, 7]);

  const model = buildTheoryControlModel({
    system: {
      system: { divisions: 12 },
      sysNames: [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
      ],
      nameForPc: (pc) =>
        ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][pc],
      rootIx: 0,
    },
    scale: {
      root: "C",
      setRoot: () => {},
      scale: "Major",
      setScale: () => {},
      scaleOptions: [{ label: "Major", pcs: [0, 2, 4, 5, 7, 9, 11] }],
      intervals: [0, 2, 4, 5, 7, 9, 11],
    },
    chord: {
      chordRoot: "C",
      setChordRoot: () => {},
      chordType: "maj",
      setChordType: () => {},
      showChord: true,
      setShowChord: () => {},
      hideNonChord: false,
      setHideNonChord: () => {},
      chordCapoRelative: true,
      setChordCapoRelative: () => {},
      chordRootIx: 0,
      chordTonePcs,
      chordOverlayPcs,
    },
    capo: { capoFret: 2 },
    randomize: {
      randomizeMode: "both",
      setRandomizeMode: () => {},
      onRandomize: () => {},
    },
    defaults: {
      root: "C",
      scale: "Major",
      chordRoot: "C",
      chordType: "maj",
    },
  });

  assert.deepEqual([...model.meta.chordTonePcs], [2, 6, 9]);
  assert.deepEqual([...model.meta.chordOverlayPcs], [2, 6, 9]);
  assert.equal(model.meta.chordRootPc, 2);
  assert.equal(model.meta.transposedChordRoot, "D");
  assert.equal(model.meta.isChordTransposed, true);
});

test("capo-relative fretboard chord selection stores shape root and displays sounding root", () => {
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const nameForPc = (pc) => noteNames[pc];
  const clickedSoundingPc = 2;
  const shapeRootPc = resolveCapoRelativeChordRootPc({
    pc: clickedSoundingPc,
    capoFret: 2,
    chordCapoRelative: true,
    divisions: 12,
  });
  const storedChordRoot = nameForPc(shapeRootPc);

  const model = buildTheoryControlModel({
    system: {
      system: { divisions: 12 },
      sysNames: noteNames,
      nameForPc,
      rootIx: 0,
    },
    scale: {
      root: "C",
      setRoot: () => {},
      scale: "Major",
      setScale: () => {},
      scaleOptions: [{ label: "Major", pcs: [0, 2, 4, 5, 7, 9, 11] }],
      intervals: [0, 2, 4, 5, 7, 9, 11],
    },
    chord: {
      chordRoot: storedChordRoot,
      setChordRoot: () => {},
      chordType: "maj",
      setChordType: () => {},
      showChord: true,
      setShowChord: () => {},
      hideNonChord: false,
      setHideNonChord: () => {},
      chordCapoRelative: true,
      setChordCapoRelative: () => {},
      chordRootIx: shapeRootPc,
      chordTonePcs: new Set([0, 4, 7]),
      chordOverlayPcs: new Set([0, 4, 7]),
    },
    capo: { capoFret: 2 },
    randomize: {
      randomizeMode: "both",
      setRandomizeMode: () => {},
      onRandomize: () => {},
    },
    defaults: {
      root: "C",
      scale: "Major",
      chordRoot: "C",
      chordType: "maj",
    },
  });

  assert.equal(storedChordRoot, "C");
  assert.equal(model.meta.transposedChordRoot, "D");
  assert.equal(model.meta.chordRootPc, clickedSoundingPc);
});

test("buildTheoryControlModel treats capo 12 as untransposed in 12-TET", () => {
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const chordTonePcs = new Set([0, 4, 7]);
  const chordOverlayPcs = new Set([0, 4, 7]);

  const model = buildTheoryControlModel({
    system: {
      system: { divisions: 12 },
      sysNames: noteNames,
      nameForPc: (pc) => noteNames[pc],
      rootIx: 0,
    },
    scale: {
      root: "C",
      setRoot: () => {},
      scale: "Major",
      setScale: () => {},
      scaleOptions: [{ label: "Major", pcs: [0, 2, 4, 5, 7, 9, 11] }],
      intervals: [0, 2, 4, 5, 7, 9, 11],
    },
    chord: {
      chordRoot: "C",
      setChordRoot: () => {},
      chordType: "maj",
      setChordType: () => {},
      showChord: true,
      setShowChord: () => {},
      hideNonChord: false,
      setHideNonChord: () => {},
      chordCapoRelative: true,
      setChordCapoRelative: () => {},
      chordRootIx: 0,
      chordTonePcs,
      chordOverlayPcs,
    },
    capo: { capoFret: 12 },
    randomize: {
      randomizeMode: "both",
      setRandomizeMode: () => {},
      onRandomize: () => {},
    },
    defaults: {
      root: "C",
      scale: "Major",
      chordRoot: "C",
      chordType: "maj",
    },
  });

  assert.deepEqual([...model.meta.chordTonePcs], [0, 4, 7]);
  assert.deepEqual([...model.meta.chordOverlayPcs], [0, 4, 7]);
  assert.equal(model.meta.chordRootPc, 0);
  assert.equal(model.meta.transposedChordRoot, "C");
  assert.equal(model.meta.isChordTransposed, false);
});

test("buildTheoryControlModel treats capo 24 as untransposed in 24-TET", () => {
  const noteNames = Array.from({ length: 24 }, (_, pc) => `N${pc}`);
  const chordTonePcs = new Set([0, 8, 14]);
  const chordOverlayPcs = new Set([0, 8, 14]);

  const model = buildTheoryControlModel({
    system: {
      system: { divisions: 24 },
      sysNames: noteNames,
      nameForPc: (pc) => noteNames[pc],
      rootIx: 0,
    },
    scale: {
      root: "N0",
      setRoot: () => {},
      scale: "Major",
      setScale: () => {},
      scaleOptions: [{ label: "Major", pcs: [0, 4, 8, 10, 14, 18, 22] }],
      intervals: [0, 4, 8, 10, 14, 18, 22],
    },
    chord: {
      chordRoot: "N0",
      setChordRoot: () => {},
      chordType: "maj",
      setChordType: () => {},
      showChord: true,
      setShowChord: () => {},
      hideNonChord: false,
      setHideNonChord: () => {},
      chordCapoRelative: true,
      setChordCapoRelative: () => {},
      chordRootIx: 0,
      chordTonePcs,
      chordOverlayPcs,
    },
    capo: { capoFret: 24 },
    randomize: {
      randomizeMode: "both",
      setRandomizeMode: () => {},
      onRandomize: () => {},
    },
    defaults: {
      root: "N0",
      scale: "Major",
      chordRoot: "N0",
      chordType: "maj",
    },
  });

  assert.deepEqual([...model.meta.chordTonePcs], [0, 8, 14]);
  assert.deepEqual([...model.meta.chordOverlayPcs], [0, 8, 14]);
  assert.equal(model.meta.chordRootPc, 0);
  assert.equal(model.meta.transposedChordRoot, "N0");
  assert.equal(model.meta.isChordTransposed, false);
});
