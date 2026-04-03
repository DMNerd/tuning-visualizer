import test from "node:test";
import assert from "node:assert/strict";

import {
  THEORY_DOMAIN_RETURN_KEYS,
  INSTRUMENT_DOMAIN_RETURN_KEYS,
  PRACTICE_DOMAIN_RETURN_KEYS,
  EXPORT_CUSTOM_DOMAIN_RETURN_KEYS,
} from "@/app/hooks/contracts";
import {
  buildTheoryDomainReturn,
  buildInstrumentDomainReturn,
  buildPracticeMetronomeDomainReturn,
  buildExportCustomTuningDomainReturn,
} from "@/app/hooks/domainReturnBuilders";

function sortedKeys(value) {
  return Object.keys(value).sort();
}

test("useTheoryDomain return-shape contract", () => {
  const actual = buildTheoryDomainReturn({
    system: {},
    scale: {},
    chord: {},
    handlers: {},
  });
  assert.deepEqual(sortedKeys(actual), [...THEORY_DOMAIN_RETURN_KEYS].sort());
});

test("useInstrumentDomain return-shape contract", () => {
  const actual = buildInstrumentDomainReturn({
    instrumentState: {},
    instrumentActions: {},
    instrumentDerived: {},
    fretsSlice: {},
    capo: {},
    presets: {},
    customTunings: {},
    customPackEditor: {},
    buildInstrumentPanel: () => {},
    buildInstrumentControlModelWithReset: () => {},
  });
  assert.deepEqual(
    sortedKeys(actual),
    [...INSTRUMENT_DOMAIN_RETURN_KEYS].sort(),
  );
});

test("usePracticeMetronomeDomain return-shape contract", () => {
  const actual = buildPracticeMetronomeDomainReturn({
    randomize: {},
    metronome: {},
    practiceActions: {},
    reset: {},
    practicePanel: {},
    metronomeControlModel: {},
  });
  assert.deepEqual(sortedKeys(actual), [...PRACTICE_DOMAIN_RETURN_KEYS].sort());
});

test("useExportCustomTuningDomain return-shape contract", () => {
  const actual = buildExportCustomTuningDomainReturn({
    fileBase: "",
    exportPanel: {},
    modalPanel: {},
    packActions: {},
  });
  assert.deepEqual(
    sortedKeys(actual),
    [...EXPORT_CUSTOM_DOMAIN_RETURN_KEYS].sort(),
  );
});
