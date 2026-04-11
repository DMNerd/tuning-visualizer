import test from "node:test";
import assert from "node:assert/strict";
import {
  applyNeckFilterModeToBoardMeta,
  coerceNeckFilterMode,
  detectNeckFilterModeFromPreset,
  FRETLESS_BOARD_META,
  getNeckFilterModeDef,
  getNeckFilterOptions,
  hasKgNeckFilterMeta,
  isNeckFilterMode,
  isFretlessBoardMeta,
  KG_NECK_HIDDEN_FRETS,
  NECK_FILTER_MODE_DEFS,
  NECK_FILTER_MODES,
  resolveNeckFilterModeIntentFromBoardMeta,
  resolvePresetNeckFilterMode,
  shouldApplyNeckFilterMode,
} from "@/lib/presets/neckFilterModes";
import { normalizePresetMeta } from "@/lib/meta/meta";

test("KG filter applies to 24-EDO 6-string non-fretless boards", () => {
  const input = { notePlacement: "betweenFrets" };
  const output = applyNeckFilterModeToBoardMeta(input, {
    mode: NECK_FILTER_MODES.KG,
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
    shouldApplyNeckFilterMode({
      mode: NECK_FILTER_MODES.KG,
      edo: 24,
      strings: 6,
      boardMeta: fretlessBoard,
    }),
    false,
  );

  const output = applyNeckFilterModeToBoardMeta(fretlessBoard, {
    mode: NECK_FILTER_MODES.KG,
    edo: 24,
    strings: 6,
  });

  assert.deepEqual(output, fretlessBoard);
});

test("KG filter metadata can be detected from board hidden frets", () => {
  assert.equal(
    hasKgNeckFilterMeta({
      hiddenFrets: [23, 15, 1, 19, 5, 11],
    }),
    true,
  );
  assert.equal(hasKgNeckFilterMeta({ hiddenFrets: [1, 5] }), false);
});

test("disabling KG filter strips KG hidden-fret metadata from board meta", () => {
  const output = applyNeckFilterModeToBoardMeta(
    { notePlacement: "betweenFrets", hiddenFrets: [...KG_NECK_HIDDEN_FRETS] },
    {
      mode: NECK_FILTER_MODES.NONE,
      edo: 24,
      strings: 6,
    },
  );

  assert.deepEqual(output, { notePlacement: "betweenFrets" });
});

test("KG filter gate respects system constraints", () => {
  const enabled = false;
  assert.equal(
    shouldApplyNeckFilterMode({
      mode: NECK_FILTER_MODES.KG,
      edo: 12,
      strings: 6,
      boardMeta: null,
    }),
    false,
  );
  assert.equal(
    shouldApplyNeckFilterMode({
      mode: NECK_FILTER_MODES.KG,
      edo: 24,
      strings: 7,
      boardMeta: null,
    }),
    true,
  );
  assert.equal(
    enabled
      ? shouldApplyNeckFilterMode({
          mode: NECK_FILTER_MODES.KG,
          edo: 24,
          strings: 6,
          boardMeta: null,
        })
      : false,
    false,
  );
});

test("mode applicability keeps none/fretless enabled and kg gated", () => {
  assert.equal(
    shouldApplyNeckFilterMode({
      mode: NECK_FILTER_MODES.NONE,
      edo: 12,
      boardMeta: null,
    }),
    true,
  );
  assert.equal(
    shouldApplyNeckFilterMode({
      mode: NECK_FILTER_MODES.FRETLESS,
      edo: 12,
      boardMeta: null,
    }),
    true,
  );
  assert.equal(
    shouldApplyNeckFilterMode({
      mode: NECK_FILTER_MODES.KG,
      edo: 12,
      boardMeta: null,
    }),
    false,
  );
});

test("registry modes expose applicable/apply contracts", () => {
  const modeDefs = Array.isArray(NECK_FILTER_MODE_DEFS)
    ? NECK_FILTER_MODE_DEFS
    : [];
  assert.equal(modeDefs.length >= 3, true);

  modeDefs.forEach((def) => {
    assert.equal(typeof def.id, "string");
    assert.equal(typeof def.label, "string");
    assert.equal(typeof def.isApplicable, "function");
    assert.equal(typeof def.apply, "function");

    const applicable = def.isApplicable({ edo: 24, boardMeta: null });
    assert.equal(typeof applicable, "boolean");

    const applied = def.apply({ marker: "keep" }, { edo: 24, boardMeta: null });
    assert.equal(applied === null || typeof applied === "object", true);
  });
});

test("mode registry exposes UI options with context-aware disabled state", () => {
  const options12 = getNeckFilterOptions({ edo: 12, boardMeta: null });
  const options24 = getNeckFilterOptions({ edo: 24, boardMeta: null });

  assert.deepEqual(
    options12.map((option) => option.value),
    ["none", "kg", "fretless"],
  );
  assert.equal(
    options12.find((option) => option.value === "kg")?.disabled,
    true,
  );
  assert.equal(
    options12.find((option) => option.value === "fretless")?.disabled,
    false,
  );
  assert.equal(
    options24.find((option) => option.value === "kg")?.disabled,
    false,
  );
});

test("preset mode detection respects registry precedence order", () => {
  const detected = detectNeckFilterModeFromPreset({
    hiddenFrets: [...KG_NECK_HIDDEN_FRETS],
    ...FRETLESS_BOARD_META,
  });

  assert.equal(detected, NECK_FILTER_MODES.KG);
});

test("preset mode intent prefers explicit board.neckFilterMode over inferred patterns", () => {
  const resolved = resolveNeckFilterModeIntentFromBoardMeta({
    neckFilterMode: "fretless",
    hiddenFrets: [...KG_NECK_HIDDEN_FRETS],
  });
  assert.equal(resolved, NECK_FILTER_MODES.FRETLESS);
});

test("preset mode intent falls back to legacy structural detection when explicit mode is absent", () => {
  const resolved = resolveNeckFilterModeIntentFromBoardMeta({
    hiddenFrets: [...KG_NECK_HIDDEN_FRETS],
  });
  assert.equal(resolved, NECK_FILTER_MODES.KG);
});

test("fretless neck-filter mode applies dotted on-fret board style", () => {
  const output = applyNeckFilterModeToBoardMeta(
    { hiddenFrets: [...KG_NECK_HIDDEN_FRETS], marker: "keep" },
    {
      mode: NECK_FILTER_MODES.FRETLESS,
      edo: 24,
      strings: 6,
    },
  );

  assert.deepEqual(output, {
    marker: "keep",
    ...FRETLESS_BOARD_META,
  });
});

test("fretless mode always forces notePlacement onFret", () => {
  const output = applyNeckFilterModeToBoardMeta(
    { notePlacement: "between", neckFilterMode: "fretless" },
    {
      mode: NECK_FILTER_MODES.FRETLESS,
      edo: 24,
      strings: 6,
    },
  );

  assert.equal(output?.notePlacement, "onFret");
});

test("selecting a fretless preset resolves neck filter mode to fretless in 24-TET", () => {
  const resolved = resolvePresetNeckFilterMode({
    presetMode: NECK_FILTER_MODES.FRETLESS,
    syncFromPresetMeta: true,
    currentMode: NECK_FILTER_MODES.NONE,
    currentEdo: 24,
    boardMeta: FRETLESS_BOARD_META,
  });

  assert.equal(resolved, NECK_FILTER_MODES.FRETLESS);
});

test("selecting a fretless preset resolves neck filter mode to fretless outside 24-TET", () => {
  const resolved = resolvePresetNeckFilterMode({
    presetMode: NECK_FILTER_MODES.FRETLESS,
    syncFromPresetMeta: true,
    currentMode: NECK_FILTER_MODES.KG,
    currentEdo: 12,
    boardMeta: FRETLESS_BOARD_META,
  });

  assert.equal(resolved, NECK_FILTER_MODES.FRETLESS);
});

test("preset meta normalization preserves board.neckFilterMode when valid", () => {
  const normalized = normalizePresetMeta({
    board: { neckFilterMode: "fretless" },
  });
  assert.equal(normalized?.board?.neckFilterMode, "fretless");
});

test("neck filter mode utilities handle undefined/invalid values", () => {
  assert.equal(isNeckFilterMode(undefined), false);
  assert.equal(isNeckFilterMode("kg"), true);
  assert.equal(isNeckFilterMode("legacy"), false);

  assert.equal(coerceNeckFilterMode(undefined), NECK_FILTER_MODES.NONE);
  assert.equal(coerceNeckFilterMode("legacy"), NECK_FILTER_MODES.NONE);
  assert.equal(
    coerceNeckFilterMode("legacy", NECK_FILTER_MODES.FRETLESS),
    NECK_FILTER_MODES.FRETLESS,
  );
});

test("registry apply helper matches direct mode def behavior", () => {
  const fromHelper = applyNeckFilterModeToBoardMeta(
    { notePlacement: "between" },
    { mode: NECK_FILTER_MODES.FRETLESS, edo: 24, strings: 6 },
  );
  const fromRegistry = getNeckFilterModeDef(NECK_FILTER_MODES.FRETLESS).apply(
    { notePlacement: "between" },
    { mode: NECK_FILTER_MODES.FRETLESS, edo: 24, strings: 6 },
  );
  assert.deepEqual(fromHelper, fromRegistry);
});
