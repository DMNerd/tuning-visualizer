import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBetweenVisibleFretsX,
  buildNoteGeometry,
  buildOpenPcByString,
  buildRenderedNotes,
} from "@features/fretboard/model/boardLayout";

const wireX = (f) => f * 10;
const betweenFretsX = (f) => f * 10 - 5;

test("buildBetweenVisibleFretsX centers notes between visible wires", () => {
  const xs = buildBetweenVisibleFretsX({
    frets: 4,
    visibleFrets: [0, 1, 3, 4],
    betweenFretsX,
    wireX,
    capoFret: 0,
    nutW: 2,
  });
  // fret 1 starts at the nut's right edge; fret 3 spans the hidden fret 2
  assert.deepEqual(xs, [-5, 6, 15, 20, 35]);
});

test("buildOpenPcByString offsets partial strings by their start fret", () => {
  const pcs = buildOpenPcByString({
    strings: 2,
    tuning: ["E", "A"],
    startFretFor: (s) => (s === 1 ? 5 : 0),
    divisions: 12,
    pcForName: (name) => ({ E: 4, A: 9 })[name],
  });
  assert.deepEqual(pcs, [4, 2]);
});

test("buildNoteGeometry skips hidden frets and unplayable positions", () => {
  const slots = buildNoteGeometry({
    strings: 2,
    frets: 3,
    startFretFor: (s) => (s === 1 ? 2 : 0),
    yForString: (s) => s * 20,
    isFretHidden: (f) => f === 1,
    openXForString: () => -8,
    notePlacementMode: "between",
    wireX,
    betweenVisibleFretsX: betweenFretsX,
  });
  assert.deepEqual(
    slots.map((n) => [n.key, n.step, n.cx]),
    [
      ["0-0", 0, -8],
      ["0-2", 2, 15],
      ["0-3", 3, 25],
      ["1-0", 0, -8],
      ["1-3", 1, 25],
    ],
  );
});

test("buildRenderedNotes shows every note only while picking", () => {
  const noteGeometry = [0, 1, 2, 3, 4].map((f) => ({
    key: `0-${f}`,
    s: 0,
    f,
    sf: 0,
    step: f,
    cy: 0,
    cx: f * 10,
    isOpen: f === 0,
  }));
  const render = (showAllNotes) =>
    buildRenderedNotes({
      noteGeometry,
      openPcByString: [0],
      divisions: 12,
      strings: 1,
      accidental: "sharp",
      activeIntervals: [0, 2, 4],
      scaleSet: new Set([0, 2, 4]),
      rootIx: 0,
      chordPCs: null,
      chordRootPc: null,
      display: {
        show: "names",
        showOpen: true,
        hideNonChord: false,
        openOnlyInMode: "none",
        showAllNotes,
        colorByDegree: false,
        colorByShape: false,
      },
      dotSize: 10,
      degreeForPc: () => null,
      labelFor: (pc) => String(pc),
      microLabelOpts: {},
      fitLabel: (variants) => ({ text: variants[0], fontSize: 10 }),
      measureWidth: () => 5,
    }).map((n) => [n.pc, n.fill]);

  assert.deepEqual(
    render(false).map(([pc]) => pc),
    [0, 2, 4],
  );
  const all = render(true);
  assert.deepEqual(
    all.map(([pc]) => pc),
    [0, 1, 2, 3, 4],
  );
  assert.equal(all[1][1], "var(--note-outside)");
  assert.equal(all[0][1], "var(--root)");
});
