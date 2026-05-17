import test from "node:test";
import assert from "node:assert/strict";

import { buildCapoChordDisplay } from "@/components/UI/controls/chordCapoDisplay";

test("capo chord display describes shape-to-sounding mapping", () => {
  const display = buildCapoChordDisplay({
    chordCapoRelative: true,
    capoFret: 2,
    isChordTransposed: true,
    originalChordRoot: "C",
    transposedChordRoot: "D",
    root: "C",
    chordTypeLabel: "Major (1 3 5)",
  });

  assert.equal(display.shapeChordLabel, "C Major (1 3 5)");
  assert.equal(display.soundingChordLabel, "D Major (1 3 5)");
  assert.equal(
    display.summaryText,
    "Shape: C Major (1 3 5) → Sounds: D Major (1 3 5) (capo 2)",
  );
  assert.equal(
    display.ariaLabel,
    "Capo-relative chord mapping: shape C Major (1 3 5); sounds D Major (1 3 5); capo 2.",
  );
});

test("capo chord display explains matching shape and sound without capo", () => {
  const display = buildCapoChordDisplay({
    chordCapoRelative: true,
    capoFret: 0,
    isChordTransposed: false,
    originalChordRoot: "C",
    transposedChordRoot: "C",
    root: "C",
    chordTypeLabel: "Major (1 3 5)",
  });

  assert.equal(display.hasActiveTransposition, false);
  assert.equal(
    display.helpText,
    "No capo set; shape and sounding chord match.",
  );
  assert.equal(
    display.summaryText,
    "No capo set; shape and sounding chord match",
  );
  assert.equal(
    display.ariaLabel,
    "Capo-relative chord mapping: shape C Major (1 3 5); sounds C Major (1 3 5); no capo set, shape and sounding chord match.",
  );
});
