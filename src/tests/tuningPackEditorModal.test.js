import test from "node:test";
import assert from "node:assert/strict";
import {
  buildNoteOptionsForPack,
  ensurePack,
  buildTemplatePack,
  togglePackSpelling,
} from "@/components/UI/modals/tuningPackNormalization";

test("ensurePack preserves a valid top-level spelling field", () => {
  const result = ensurePack({
    name: "DE pack",
    spelling: "german",
    system: { edo: 12 },
    tuning: { strings: [{ note: "H" }] },
    meta: {},
  });

  assert.equal(result.spelling, "german");
});

test("ensurePack omits empty/invalid spelling field", () => {
  const emptySpelling = ensurePack({
    name: "Pack",
    spelling: "   ",
    system: { edo: 12 },
    tuning: { strings: [{ note: "B" }] },
  });
  assert.equal("spelling" in emptySpelling, false);
});

test("buildTemplatePack keeps spelling while normalizing template data", () => {
  const result = buildTemplatePack({
    name: "Template source",
    spelling: "czech",
    system: { edo: 12 },
    tuning: {
      strings: [{ label: "String 1", note: "H" }, { label: "String 2", note: "E" }],
    },
    meta: {},
  });

  assert.equal(result.spelling, "czech");
});

test("ensurePack trims spelling hint but preserves marker text exactly", () => {
  const result = ensurePack({
    name: "Pack",
    spelling: "  de-h/b  ",
    system: { edo: 12 },
    tuning: { strings: [{ note: "E" }] },
  });

  assert.equal(result.spelling, "de-h/b");
});

test("buildNoteOptionsForPack renders German note options when spelling is german", () => {
  const germanOptions = buildNoteOptionsForPack({
    name: "German options",
    spelling: "german",
    system: { edo: 12 },
    tuning: { strings: [{ note: "E" }] },
    meta: {},
  }).noteOptions;

  assert.equal(germanOptions.includes("H"), true);
  assert.equal(germanOptions.includes("B"), true);
  assert.equal(germanOptions.includes("Cis"), true);

  const englishOptions = buildNoteOptionsForPack({
    name: "English options",
    system: { edo: 12 },
    tuning: { strings: [{ note: "E" }] },
    meta: {},
  }).noteOptions;

  assert.equal(englishOptions.includes("B"), true);
  assert.equal(englishOptions.includes("H"), false);
  assert.equal(englishOptions.includes("C#"), true);
});

test("togglePackSpelling quickly adds and removes spelling hint", () => {
  const basePack = {
    name: "Quick toggle",
    system: { edo: 12 },
    tuning: { strings: [{ note: "E" }] },
    meta: {},
    vendor: "acme-lab",
    source: { importedFrom: "legacy-json" },
  };

  const withSpelling = togglePackSpelling(basePack, "de-h/b");
  assert.equal(withSpelling.spelling, "de-h/b");
  assert.equal(withSpelling.vendor, "acme-lab");
  assert.deepEqual(withSpelling.source, { importedFrom: "legacy-json" });

  const withoutSpelling = togglePackSpelling(withSpelling, "de-h/b");
  assert.equal("spelling" in withoutSpelling, false);
  assert.equal(withoutSpelling.vendor, "acme-lab");
  assert.deepEqual(withoutSpelling.source, { importedFrom: "legacy-json" });
});
