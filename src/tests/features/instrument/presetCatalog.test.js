import test from "node:test";
import assert from "node:assert/strict";
import { buildPresetCatalog } from "@features/instrument/model/presetCatalog";

const presetTunings = {
  "12-TET": {
    4: { "Bass Standard": ["E", "A", "D", "G"] },
    6: { Standard: ["E", "A", "D", "G", "B", "E"] },
    7: {
      Standard: ["B", "E", "A", "D", "G", "B", "E"],
      "Drop A": ["A", "E", "A", "D", "G", "B", "E"],
    },
  },
};

function build(overrides = {}) {
  return buildPresetCatalog({
    systemId: "12-TET",
    edo: 12,
    currentStrings: 6,
    currentPresetMap: {
      "Factory default": ["E", "A", "D", "G", "B", "E"],
      Standard: ["E", "A", "D", "G", "B", "E"],
    },
    currentPresetMetaMap: {},
    currentCustomNames: [],
    presetTunings,
    presetMeta: {},
    customTunings: [],
    ...overrides,
  });
}

test("buildPresetCatalog lists every string count, sorted ascending", () => {
  const catalog = build();
  assert.deepEqual(
    catalog.map((entry) => entry.key),
    [
      "4:Bass Standard",
      "6:Factory default",
      "6:Standard",
      "7:Standard",
      "7:Drop A",
    ],
  );
});

test("buildPresetCatalog keeps same-named presets separate per string count", () => {
  const catalog = build();
  const standards = catalog.filter((entry) => entry.name === "Standard");
  assert.deepEqual(
    standards.map((entry) => entry.tuning.length),
    [6, 7],
  );
});

test("buildPresetCatalog uses the merged map for the current string count", () => {
  const catalog = build({
    currentPresetMap: { "Saved default": ["D", "A", "D", "G", "B", "E"] },
  });
  const current = catalog.filter((entry) => entry.strings === 6);
  assert.deepEqual(
    current.map((entry) => entry.name),
    ["Saved default"],
  );
});

test("buildPresetCatalog adds custom packs of other counts with a matching EDO", () => {
  const catalog = build({
    customTunings: [
      {
        name: "My 5",
        system: { edo: 12 },
        tuning: {
          strings: ["B", "E", "A", "D", "G"].map((note) => ({ note })),
        },
      },
      {
        name: "Quarter 5",
        system: { edo: 24 },
        tuning: {
          strings: ["B", "E", "A", "D", "G"].map((note) => ({ note })),
        },
      },
    ],
  });
  const fiveString = catalog.filter((entry) => entry.strings === 5);
  assert.equal(fiveString.length, 1);
  assert.equal(fiveString[0].name, "My 5");
  assert.equal(fiveString[0].isCustom, true);
});
