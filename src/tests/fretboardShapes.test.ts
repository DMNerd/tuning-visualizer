import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFretboardMap,
  canonicalizeShape,
  dedupeShapesByTemplate,
  findDistinctWindowShapeOccurrences,
  extractAnchorCenteredShape,
  extractConnectedComponentShapes,
  extractConnectedComponentShapesWithAdjacency,
  extractWindowShape,
  makeRectAdjacency,
  mod,
  propagateFret,
  propagateFretClass,
  propagateFretToRange,
  toRelativePitchClasses,
} from "@/lib/theory/fretboardShapes";

void test("mod normalizes negatives to [0, n-1]", () => {
  assert.equal(mod(-1, 12), 11);
  assert.equal(mod(13, 12), 1);
});

void test("supports arbitrary temperament and string count", () => {
  const notes = buildFretboardMap({
    n: 19,
    tuning: [0, 7, 14],
    pcs: [0, 3, 7],
    pcsMode: "relative",
    rootPc: 5,
    fretMin: 0,
    fretMax: 6,
  });

  assert.ok(notes.length > 0);
  assert.ok(
    notes.every(
      (note) => note.degree === 0 || note.degree === 3 || note.degree === 7,
    ),
  );
});

void test("absolute pcs are normalized against root", () => {
  const rel = toRelativePitchClasses([2, 5, 9], 2, 12);
  assert.deepEqual(rel, [0, 3, 7]);

  const notes = buildFretboardMap({
    n: 12,
    tuning: [4, 9],
    pcs: [2, 5, 9],
    pcsMode: "absolute",
    rootPc: 2,
    fretMin: 0,
    fretMax: 3,
  });

  assert.ok(notes.every((note) => [0, 3, 7].includes(note.degree)));
});

void test("root location can infer root pc", () => {
  const notes = buildFretboardMap({
    n: 12,
    tuning: [4, 9],
    pcs: [0],
    pcsMode: "relative",
    fretMin: 0,
    fretMax: 2,
    rootLocation: { string: 0, fret: 1 },
    rootLocationMode: "infer-from-location",
  });

  assert.deepEqual(
    notes.map((note) => [note.string, note.fret]),
    [
      [0, 1],
      [1, 8],
    ].filter(([, fret]) => fret <= 2),
  );
});

void test("root location mismatch throws when strict", () => {
  assert.throws(() =>
    buildFretboardMap({
      n: 12,
      tuning: [4],
      pcs: [0],
      pcsMode: "relative",
      rootPc: 0,
      fretMin: 0,
      fretMax: 2,
      rootLocation: { string: 0, fret: 0 },
      rootLocationMode: "require-match",
    }),
  );
});

void test("extract window and anchor centered shapes", () => {
  const notes = buildFretboardMap({
    n: 12,
    tuning: [4, 9, 2],
    pcs: [0, 3, 7],
    rootPc: 4,
    fretMin: 0,
    fretMax: 8,
  });

  const windowShape = extractWindowShape(notes, { startFret: 3, width: 2 });
  assert.ok(windowShape.every((note) => note.fret >= 3 && note.fret <= 4));

  const anchorShape = extractAnchorCenteredShape(notes, {
    anchor: { string: 1, fret: 4 },
    maxStringDistance: 1,
    maxFretDistance: 1,
  });
  assert.ok(
    anchorShape.every(
      (note) => Math.abs(note.string - 1) <= 1 && Math.abs(note.fret - 4) <= 1,
    ),
  );
});

void test("connected components and canonical dedupe are translation-invariant", () => {
  const shapeA = [
    { string: 0, fret: 1, pc: 0, degree: 0, isRoot: true },
    { string: 1, fret: 3, pc: 3, degree: 3, isRoot: false },
  ];
  const shapeB = [
    { string: 0, fret: 6, pc: 0, degree: 0, isRoot: true },
    { string: 1, fret: 8, pc: 3, degree: 3, isRoot: false },
  ];

  assert.deepEqual(canonicalizeShape(shapeA), canonicalizeShape(shapeB));

  const deduped = dedupeShapesByTemplate([shapeA, shapeB]);
  assert.equal(deduped.length, 1);
});

void test("connected component extraction respects geometric thresholds", () => {
  const notes = [
    { string: 0, fret: 1, pc: 0, degree: 0, isRoot: true },
    { string: 0, fret: 2, pc: 1, degree: 1, isRoot: false },
    { string: 5, fret: 12, pc: 0, degree: 0, isRoot: true },
  ];

  const components = extractConnectedComponentShapes(notes, {
    maxStringStep: 1,
    maxFretStep: 1,
  });

  assert.equal(components.length, 2);
  assert.equal(components[0].length + components[1].length, 3);
});

void test("propagateFret derives shift from tuning deltas", () => {
  const tuning = [4, 9, 2, 7, 11, 4]; // EADGBE (high to low ordering here)
  const projected = propagateFret(5, 0, 1, tuning, 12);
  const projectedClass = propagateFretClass(5, 0, 1, tuning, 12);
  const projectedInRange = propagateFretToRange(5, 0, 1, tuning, 12, 0, 24);

  assert.equal(projected, 0);
  assert.equal(projectedClass, 0);
  assert.deepEqual(projectedInRange, [0, 12, 24]);
});

void test("window shape occurrence discovery returns templates and occurrences", () => {
  const notes = buildFretboardMap({
    n: 12,
    tuning: [4, 9, 2, 7, 11, 4],
    pcs: [0, 3, 5, 7, 10],
    rootPc: 4,
    fretMin: 0,
    fretMax: 12,
  });

  const { templates, occurrences } = findDistinctWindowShapeOccurrences(notes, {
    fretMin: 0,
    fretMax: 12,
    width: 3,
    minNotes: 3,
    requireRoot: true,
  });

  assert.ok(occurrences.length > 0);
  assert.ok(templates.length > 0);
  assert.ok(templates.length <= occurrences.length);
});

void test("connected component adjacency can be customized", () => {
  const notes = [
    { string: 0, fret: 0, pc: 0, degree: 0, isRoot: true },
    { string: 1, fret: 1, pc: 1, degree: 1, isRoot: false },
    { string: 2, fret: 4, pc: 2, degree: 2, isRoot: false },
  ];
  const defaultAdjacency = makeRectAdjacency({
    maxStringStep: 1,
    maxFretStep: 1,
  });
  const components = extractConnectedComponentShapesWithAdjacency(
    notes,
    defaultAdjacency,
  );
  assert.equal(components.length, 2);
});

void test("buildFretboardMap validates integer pitch values", () => {
  assert.throws(() =>
    buildFretboardMap({
      n: 12,
      tuning: [0.5, 7],
      pcs: [0, 3, 7],
      rootPc: 0,
      fretMin: 0,
      fretMax: 12,
    }),
  );
});
