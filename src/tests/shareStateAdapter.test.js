import test from "node:test";
import assert from "node:assert/strict";

import { buildShareDomainState } from "@/app/adapters/shareState";

void test("buildShareDomainState emits only codec-consumed share shape", () => {
  const state = buildShareDomainState({
    theoryDomain: {
      system: { systemId: "12-TET", root: "C" },
      scale: { scale: "Major (Ionian)" },
      chord: {
        chordRoot: "D",
        chordType: "m7",
        showChord: true,
        hideNonChord: false,
      },
    },
    instrumentDomain: {
      instrumentState: {
        strings: 6,
        frets: 24,
        tuning: [{ note: "E2", formatter: () => "skip" }],
        stringMeta: { 0: { startFret: 0 } },
        boardMeta: { hiddenFrets: new Set([1, 2]) },
        kgNeckFilterEnabled: true,
      },
      presets: { selectedPreset: "Drop D" },
      customTunings: {
        customTunings: [{ name: "Drop D", tuning: ["D2", "A2"] }],
      },
    },
    displayPrefs: {
      show: "degrees",
      withFn: () => "skip",
    },
    practiceDomain: {
      metronome: {
        prefs: { bpm: 120, next: undefined },
      },
      randomize: { randomizeMode: "scale" },
    },
  });

  assert.deepEqual(state.theory.system, { systemId: "12-TET" });
  assert.equal("scale" in state.theory, false);
  assert.equal("chord" in state.theory, false);
  assert.equal(state.instrument.presets.selectedPreset, "Drop D");
  assert.deepEqual(state.instrument.instrumentState.tuning, [{ note: "E2" }]);
  assert.deepEqual(state.instrument.instrumentState.boardMeta, {
    hiddenFrets: [1, 2],
  });
  assert.deepEqual(state.instrument.customTunings, [
    { name: "Drop D", tuning: ["D2", "A2"] },
  ]);
  assert.equal("capo" in state.instrument, false);
  assert.equal("display" in state, false);
  assert.equal("practice" in state, false);
});
