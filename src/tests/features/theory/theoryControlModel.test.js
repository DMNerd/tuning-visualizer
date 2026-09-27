import test from "node:test";
import assert from "node:assert/strict";

import { buildTheoryControlModel } from "@features/theory/model/controlModel";
import { resolveCapoRelativeChordRootPc } from "@domain/theory/capoChords";
import { buildChordFit } from "@features/theory/model/theoryPanelModel";

const NOTE_NAMES_12 = [
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
const MAJOR_12 = [0, 2, 4, 5, 7, 9, 11];
const noop = () => {};

function buildModel({
  divisions = 12,
  sysNames = NOTE_NAMES_12,
  nameForPc = (pc) => sysNames[pc],
  rootName = sysNames[0],
  scalePcs = MAJOR_12,
  chord = {},
  capo,
} = {}) {
  return buildTheoryControlModel({
    system: {
      system: { divisions },
      sysNames,
      nameForPc,
      rootIx: 0,
    },
    scale: {
      root: rootName,
      setRoot: noop,
      scale: "Major",
      setScale: noop,
      scaleOptions: [{ label: "Major", pcs: scalePcs }],
      intervals: scalePcs,
    },
    chord: {
      chordRoot: rootName,
      setChordRoot: noop,
      chordType: "maj",
      setChordType: noop,
      showChord: true,
      setShowChord: noop,
      hideNonChord: false,
      setHideNonChord: noop,
      chordRootIx: 0,
      ...chord,
    },
    ...(capo ? { capo } : {}),
    randomize: {
      randomizeMode: "both",
      setRandomizeMode: noop,
      onRandomize: noop,
    },
    defaults: {
      root: rootName,
      scale: "Major",
      chordRoot: rootName,
      chordType: "maj",
    },
  });
}

const capoRelative = { chordCapoRelative: true, setChordCapoRelative: noop };

// Capo-relative major triad (C E G shape) with fresh pitch-class sets.
const capoTriadChord = (extra = {}) => ({
  ...capoRelative,
  chordTonePcs: new Set([0, 4, 7]),
  chordOverlayPcs: new Set([0, 4, 7]),
  ...extra,
});

test("buildTheoryControlModel carries canonical chord PC set names", () => {
  const chordTonePcs = new Set([0, 4, 7]);
  const chordOverlayPcs = new Set([0, 4, 7]);

  const model = buildModel({
    sysNames: ["C", "D", "E", "F", "G", "A", "B"],
    nameForPc: (pc) => `N${pc}`,
    chord: { chordTonePcs, chordOverlayPcs },
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
  const model = buildModel({
    chord: capoTriadChord(),
    capo: { capoFret: 2 },
  });

  assert.deepEqual([...model.meta.chordTonePcs], [2, 6, 9]);
  assert.deepEqual([...model.meta.chordOverlayPcs], [2, 6, 9]);
  assert.equal(model.meta.chordRootPc, 2);
  assert.equal(model.meta.transposedChordRoot, "D");
  assert.equal(model.meta.isChordTransposed, true);
});

test("capo-relative fretboard chord selection stores shape root and displays sounding root", () => {
  const nameForPc = (pc) => NOTE_NAMES_12[pc];
  const clickedSoundingPc = 2;
  const shapeRootPc = resolveCapoRelativeChordRootPc({
    pc: clickedSoundingPc,
    capoFret: 2,
    chordCapoRelative: true,
    divisions: 12,
  });
  const storedChordRoot = nameForPc(shapeRootPc);

  const model = buildModel({
    nameForPc,
    chord: capoTriadChord({
      chordRoot: storedChordRoot,
      chordRootIx: shapeRootPc,
    }),
    capo: { capoFret: 2 },
  });

  assert.equal(storedChordRoot, "C");
  assert.equal(model.meta.transposedChordRoot, "D");
  assert.equal(model.meta.chordRootPc, clickedSoundingPc);
});

test("buildTheoryControlModel treats capo 12 as untransposed in 12-TET", () => {
  const model = buildModel({
    chord: capoTriadChord(),
    capo: { capoFret: 12 },
  });

  assert.deepEqual([...model.meta.chordTonePcs], [0, 4, 7]);
  assert.deepEqual([...model.meta.chordOverlayPcs], [0, 4, 7]);
  assert.equal(model.meta.chordRootPc, 0);
  assert.equal(model.meta.transposedChordRoot, "C");
  assert.equal(model.meta.isChordTransposed, false);
});

test("buildTheoryControlModel treats capo 24 as untransposed in 24-TET", () => {
  const model = buildModel({
    divisions: 24,
    sysNames: Array.from({ length: 24 }, (_, pc) => `N${pc}`),
    scalePcs: [0, 4, 8, 10, 14, 18, 22],
    chord: {
      ...capoRelative,
      chordTonePcs: new Set([0, 8, 14]),
      chordOverlayPcs: new Set([0, 8, 14]),
    },
    capo: { capoFret: 24 },
  });

  assert.deepEqual([...model.meta.chordTonePcs], [0, 8, 14]);
  assert.deepEqual([...model.meta.chordOverlayPcs], [0, 8, 14]);
  assert.equal(model.meta.chordRootPc, 0);
  assert.equal(model.meta.transposedChordRoot, "N0");
  assert.equal(model.meta.isChordTransposed, false);
});

test("independent-of-scale chord-only mode uses the chord as the fretboard scale", () => {
  // A minor chord (A C E) over C major: the chord root replaces the scale
  // root and the chord's intervals replace the scale's.
  const chordTonePcs = new Set([9, 0, 4]);
  const chord = {
    chordRoot: "A",
    chordRootIx: 9,
    chordTonePcs,
    chordOverlayPcs: chordTonePcs,
    hideNonChord: true,
    chordIgnoresScale: true,
  };

  const model = buildModel({ chord });
  assert.equal(model.state.chordIgnoresScale, true);
  assert.equal(model.meta.fretboardRootIx, 9);
  assert.deepEqual(model.meta.fretboardIntervals, [0, 3, 7]);
  // The scale panel keeps the real scale.
  assert.equal(model.meta.rootIx, 0);
  assert.deepEqual(model.state.intervals, MAJOR_12);

  for (const override of [
    { chordIgnoresScale: false },
    { hideNonChord: false },
    { showChord: false },
  ]) {
    const inactive = buildModel({ chord: { ...chord, ...override } });
    assert.equal(inactive.meta.fretboardRootIx, 0);
    assert.equal(inactive.meta.fretboardIntervals, MAJOR_12);
  }
});

test("independent-of-scale mode follows the capo-transposed chord root", () => {
  const chordTonePcs = new Set([0, 4, 7]);
  const model = buildModel({
    chord: {
      chordTonePcs,
      chordOverlayPcs: chordTonePcs,
      hideNonChord: true,
      chordIgnoresScale: true,
      ...capoRelative,
    },
    capo: { capoFret: 2 },
  });
  assert.equal(model.meta.fretboardRootIx, model.meta.chordRootPc);
  assert.equal(model.meta.fretboardRootIx, 2);
  assert.deepEqual(model.meta.fretboardIntervals, [0, 4, 7]);
});
