import test from "node:test";
import assert from "node:assert/strict";

import {
  CHORD_PRESETS,
  collectNotesNearShape,
  createCagedMajorSpec,
  createPentatonicBoxSpec,
  createThreeNpsSpec,
  generateShapeFamily,
  getNotesPerString,
  labelStandardGuitarCagedTemplatesHeuristically,
  resolveRelativePitchClassSet,
  shapeDegreeCoverage,
  shapeHasContiguousStrings,
  shapeMatchesNotesPerString,
} from "@/lib/theory/shapeSystems";

void test("notes-per-string analysis and constraints are generic", () => {
  const shape = [
    { string: 0, fret: 1, pc: 0, degree: 0, isRoot: true },
    { string: 0, fret: 3, pc: 2, degree: 2, isRoot: false },
    { string: 1, fret: 2, pc: 4, degree: 4, isRoot: false },
  ];

  const counts = getNotesPerString(shape);
  assert.equal(counts.get(0), 2);
  assert.equal(counts.get(1), 1);

  assert.equal(
    shapeMatchesNotesPerString(shape, { kind: "min-max", min: 1, max: 2 }),
    true,
  );
  assert.equal(
    shapeMatchesNotesPerString(shape, { kind: "exact", value: 2 }),
    false,
  );
});

void test("contiguous-strings and degree coverage helpers work", () => {
  const shape = [
    { string: 0, fret: 1, pc: 0, degree: 0, isRoot: true },
    { string: 2, fret: 3, pc: 3, degree: 3, isRoot: false },
    { string: 3, fret: 5, pc: 7, degree: 7, isRoot: false },
  ];

  assert.equal(shapeHasContiguousStrings(shape), false);

  const coverage = shapeDegreeCoverage(shape, [0, 3, 5, 7, 10]);
  assert.deepEqual(coverage, {
    covered: 3,
    total: 5,
    degrees: [0, 3, 7],
  });
});

void test("relative coverage set resolution is explicit for absolute and relative pcs", () => {
  assert.deepEqual(
    resolveRelativePitchClassSet({
      n: 12,
      pcs: [4, 8, 11],
      pcsMode: "absolute",
      rootPc: 4,
    }),
    [0, 4, 7],
  );
  assert.deepEqual(
    resolveRelativePitchClassSet({
      n: 12,
      pcs: [0, 3, 7],
      pcsMode: "relative",
      rootPc: 4,
    }),
    [0, 3, 7],
  );
});

void test("pentatonic preset generates filtered compact families", () => {
  const result = generateShapeFamily({
    fretboardInput: {
      n: 12,
      tuning: [4, 9, 2, 7, 11, 4],
      rootPc: 4,
      fretMin: 0,
      fretMax: 12,
    },
    systemSpec: createPentatonicBoxSpec(),
  });

  assert.ok(result.templates.length > 0);
  assert.ok(result.occurrences.length > 0);
  assert.equal(Object.keys(result.templateToOccurrences).length > 0, true);

  for (const template of result.templates) {
    assert.ok(template.summary.rootLocations.length > 0);
    assert.ok(template.summary.fretSpan[1] - template.summary.fretSpan[0] <= 4);
  }
});

void test("3NPS preset enforces exact notes per participating string", () => {
  const result = generateShapeFamily({
    fretboardInput: {
      n: 12,
      tuning: [4, 9, 2, 7, 11, 4],
      rootPc: 4,
      fretMin: 0,
      fretMax: 12,
    },
    systemSpec: createThreeNpsSpec(),
  });

  assert.ok(result.templates.length > 0);
  for (const template of result.templates) {
    const counts = [...getNotesPerString(template.notes).values()];
    assert.ok(counts.length > 0);
    assert.ok(counts.every((count) => count === 3));
    assert.equal(shapeHasContiguousStrings(template.notes), true);
  }
});

void test("chord-anchored CAGED preset yields neighborhood shapes around chord skeletons", () => {
  const systemSpec = createCagedMajorSpec();
  const result = generateShapeFamily({
    fretboardInput: {
      n: 12,
      tuning: [4, 9, 2, 7, 11, 4],
      rootPc: 4,
      fretMin: 0,
      fretMax: 12,
    },
    systemSpec,
  });

  assert.ok(result.templates.length > 0);
  for (const template of result.templates) {
    const chordToneCoverage = shapeDegreeCoverage(
      template.notes,
      CHORD_PRESETS.majorTriad,
    );
    assert.ok(chordToneCoverage.covered >= 3);
  }
});

void test("heuristic CAGED naming remains explicitly non-authoritative", () => {
  const systemSpec = createCagedMajorSpec();
  const result = generateShapeFamily({
    fretboardInput: {
      n: 12,
      tuning: [4, 9, 2, 7, 11, 4],
      rootPc: 4,
      fretMin: 0,
      fretMax: 12,
    },
    systemSpec,
  });

  const labels = labelStandardGuitarCagedTemplatesHeuristically({
    n: 12,
    tuning: [4, 9, 2, 7, 11, 4],
    systemSpec,
    templates: result.templates,
  });

  assert.ok(Object.keys(labels).length > 0);
  assert.ok(Object.values(labels).every((label) => ["C", "A", "G", "E", "D"].includes(label)));

  const nonStandardLabels = labelStandardGuitarCagedTemplatesHeuristically({
    n: 19,
    tuning: [0, 7, 14],
    systemSpec,
    templates: result.templates,
  });
  assert.deepEqual(nonStandardLabels, {});
});

void test("collectNotesNearShape merges anchor and nearby scale notes without duplicates", () => {
  const anchor = [
    { string: 1, fret: 5, pc: 4, degree: 0, isRoot: true },
    { string: 2, fret: 4, pc: 8, degree: 4, isRoot: false },
  ];
  const scaleNotes = [
    ...anchor,
    { string: 1, fret: 7, pc: 7, degree: 3, isRoot: false },
    { string: 4, fret: 12, pc: 9, degree: 5, isRoot: false },
  ];
  const merged = collectNotesNearShape(anchor, scaleNotes, {
    fretRadius: 2,
    stringRadius: 1,
  });
  assert.equal(merged.length, 3);
});
