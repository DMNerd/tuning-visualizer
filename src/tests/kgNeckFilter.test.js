import test from "node:test";
import assert from "node:assert/strict";
import {
  KG_NECK_HIDDEN_FRETS,
  applyKgNeckFilterToBoardMeta,
  isFretlessBoardMeta,
  shouldApplyKgNeckFilter,
} from "@/lib/presets/kgNeckFilter";

test("KG filter applies to 24-EDO 6-string non-fretless boards", () => {
  const input = { notePlacement: "betweenFrets" };
  const output = applyKgNeckFilterToBoardMeta(input, {
    enabled: true,
    edo: 24,
    strings: 6,
  });

  assert.deepEqual(output, {
    notePlacement: "betweenFrets",
    hiddenFrets: [...KG_NECK_HIDDEN_FRETS],
  });
});

test("KG filter does not override fretless board meta", () => {
  const fretlessBoard = { fretStyle: "dotted", notePlacement: "onFret" };

  assert.equal(isFretlessBoardMeta(fretlessBoard), true);
  assert.equal(
    shouldApplyKgNeckFilter({
      enabled: true,
      edo: 24,
      strings: 6,
      boardMeta: fretlessBoard,
    }),
    false,
  );

  const output = applyKgNeckFilterToBoardMeta(fretlessBoard, {
    enabled: true,
    edo: 24,
    strings: 6,
  });

  assert.deepEqual(output, fretlessBoard);
});

test("KG filter gate respects system and string-count constraints", () => {
  assert.equal(
    shouldApplyKgNeckFilter({
      enabled: true,
      edo: 12,
      strings: 6,
      boardMeta: null,
    }),
    false,
  );
  assert.equal(
    shouldApplyKgNeckFilter({
      enabled: true,
      edo: 24,
      strings: 7,
      boardMeta: null,
    }),
    false,
  );
  assert.equal(
    shouldApplyKgNeckFilter({
      enabled: false,
      edo: 24,
      strings: 6,
      boardMeta: null,
    }),
    false,
  );
});
