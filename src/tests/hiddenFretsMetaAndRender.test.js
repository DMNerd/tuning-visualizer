import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Fretboard from "@/components/Fretboard/Fretboard";
import { PRESET_TUNING_META } from "@/lib/presets/presets";
import { normalizePresetMeta } from "@/lib/meta/meta";
import { TUNINGS, findSystemByEdo } from "@/lib/theory/tuning";
import {
  normalizeHiddenFrets,
  buildRenderedFretIndices,
  resolveVisibleCapoFret,
  reconcileCapoState,
} from "@/components/Fretboard/renderFilters";
import { buildFretLabel } from "@/utils/fretLabels";

test("King Gizzard 24-TET preset meta includes hidden fret board config", () => {
  const meta = PRESET_TUNING_META["24-TET"]?.[6]?.["King Gizzard (C#F#C#F#BE)"];
  assert.ok(meta?.board, "expected board metadata for King Gizzard preset");

  const hiddenFrets = meta.board.hiddenFrets;
  assert.deepEqual(hiddenFrets, [1, 5, 11, 15, 19, 23]);
});

test("24-TET visibility keeps requested added micro frets and excludes filtered ones", () => {
  const hidden = new Set(
    PRESET_TUNING_META["24-TET"]?.[6]?.["King Gizzard (C#F#C#F#BE)"]?.board
      ?.hiddenFrets ?? [],
  );

  const shouldShow = [3, 7, 9, 13, 17, 21]; // 1.5, 3.5, 4.5, 6.5, 8.5, 10.5 semitone positions
  const shouldHide = [1, 5, 11, 15, 19, 23];

  shouldShow.forEach((index) => {
    assert.equal(
      hidden.has(index),
      false,
      `expected visible micro fret ${index}`,
    );
  });

  shouldHide.forEach((index) => {
    assert.equal(
      hidden.has(index),
      true,
      `expected hidden micro fret ${index}`,
    );
  });
});

test("hidden fret filtering behavior is index-based and remains N-TET agnostic", () => {
  const nineteenTet = findSystemByEdo(TUNINGS, 19)?.system;
  assert.ok(nineteenTet, "expected fallback 19-TET system to resolve");

  const hidden = new Set([1, 4, 7]);
  const visible = Array.from({ length: 9 }, (_, fret) => fret).filter(
    (fret) => !hidden.has(fret),
  );

  assert.equal(nineteenTet.divisions, 19);
  assert.deepEqual(visible, [0, 2, 3, 5, 6, 8]);
});

test("unit: buildRenderedFretIndices omits hidden fret indices", () => {
  const hidden = normalizeHiddenFrets([1, 3]);
  const visibleFrets = buildRenderedFretIndices(3, hidden);

  // Fretboard uses this same filtered list to render both fret-number markers
  // and note-generation loops, so hidden entries cannot create either output.
  assert.deepEqual(visibleFrets, [0, 2]);
});

test("unit: hidden fret normalization drops negative indices in runtime and metadata paths", () => {
  const runtime = normalizeHiddenFrets([-3, -1, 0, 2, 2.5, "4", 5]);
  assert.deepEqual(Array.from(runtime.values()), [0, 2, 5]);

  const normalizedMeta = normalizePresetMeta(
    {
      board: {
        hiddenFrets: [-8, -1, 0, 4, 4.2, 7],
      },
    },
    { stringMetaFormat: "array" },
  );

  assert.deepEqual(normalizedMeta?.board?.hiddenFrets, [0, 4, 7]);
});

test("unit: resolveVisibleCapoFret falls back to nearest visible fret when capo is hidden", () => {
  const visibleFrets = [0, 2, 4, 5];

  assert.equal(resolveVisibleCapoFret(2, visibleFrets), 2);
  assert.equal(resolveVisibleCapoFret(3, visibleFrets), 2);
  assert.equal(resolveVisibleCapoFret(99, visibleFrets), 5);
  assert.equal(resolveVisibleCapoFret(-10, visibleFrets), 0);
});

test("unit: reconcileCapoState normalizes hidden input capo values", () => {
  const calls = [];
  const onSetCapo = (value) => calls.push(value);

  const didNormalize = reconcileCapoState(3, 2, onSetCapo);
  assert.equal(didNormalize, true);
  assert.deepEqual(calls, [2]);

  const didNormalizeAgain = reconcileCapoState(2, 2, onSetCapo);
  assert.equal(didNormalizeAgain, false);
  assert.deepEqual(calls, [2]);
});

test("integration: Fretboard render excludes hidden-fret wires, markers, and note artifacts", () => {
  const markup = renderToStaticMarkup(
    React.createElement(Fretboard, {
      strings: 1,
      frets: 3,
      tuning: ["E"],
      rootIx: 0,
      intervals: [],
      accidental: "sharp",
      noteNaming: "english",
      microLabelStyle: "letters",
      show: "fret",
      showOpen: true,
      showFretNums: true,
      dotSize: 12,
      lefty: false,
      system: TUNINGS["12-TET"],
      chordPCs: null,
      chordRootPc: null,
      openOnlyInScale: false,
      colorByDegree: false,
      hideNonChord: false,
      stringMeta: null,
      boardMeta: { hiddenFrets: [1, 3] },
      capoFret: 0,
      onSetCapo: () => {},
    }),
  );

  const fretWireCount = (
    markup.match(/class="[^"]*\btv-fretboard__fret\b[^"]*"/g) ?? []
  ).length;
  const markerCount = (
    markup.match(/class="[^"]*\btv-fretboard__marker\b[^"]*"/g) ?? []
  ).length;
  const noteCircleCount = (markup.match(/<circle\b/g) ?? []).length;

  // With frets 0..3 and hidden [1,3], only 0 and 2 should render.
  assert.equal(fretWireCount, 2);
  assert.equal(markerCount, 2);
  assert.equal(noteCircleCount, 2);

  // In show="fret" mode, note labels mirror generated note frets.
  assert.match(markup, />0<|>2</);
  assert.doesNotMatch(markup, />1<|>3</);
});

test("integration: hidden capo fret is remapped to a visible fallback", () => {
  const hiddenCapoMarkup = renderToStaticMarkup(
    React.createElement(Fretboard, {
      strings: 1,
      frets: 3,
      tuning: ["E"],
      rootIx: 0,
      intervals: [],
      accidental: "sharp",
      noteNaming: "english",
      microLabelStyle: "letters",
      show: "fret",
      showOpen: true,
      showFretNums: true,
      dotSize: 12,
      lefty: false,
      system: TUNINGS["12-TET"],
      chordPCs: null,
      chordRootPc: null,
      openOnlyInScale: false,
      colorByDegree: false,
      hideNonChord: false,
      stringMeta: null,
      boardMeta: { hiddenFrets: [1, 3] },
      capoFret: 3,
      onSetCapo: () => {},
    }),
  );

  const explicitFallbackMarkup = renderToStaticMarkup(
    React.createElement(Fretboard, {
      strings: 1,
      frets: 3,
      tuning: ["E"],
      rootIx: 0,
      intervals: [],
      accidental: "sharp",
      noteNaming: "english",
      microLabelStyle: "letters",
      show: "fret",
      showOpen: true,
      showFretNums: true,
      dotSize: 12,
      lefty: false,
      system: TUNINGS["12-TET"],
      chordPCs: null,
      chordRootPc: null,
      openOnlyInScale: false,
      colorByDegree: false,
      hideNonChord: false,
      stringMeta: null,
      boardMeta: { hiddenFrets: [1, 3] },
      capoFret: 2,
      onSetCapo: () => {},
    }),
  );

  const hiddenNutX = hiddenCapoMarkup.match(
    /class="tv-fretboard__nut" x="([^"]+)"/,
  )?.[1];
  const explicitNutX = explicitFallbackMarkup.match(
    /class="tv-fretboard__nut" x="([^"]+)"/,
  )?.[1];

  assert.equal(hiddenNutX, explicitNutX);

  // Hidden capo fret 3 falls back to nearest visible fret 2.
  assert.match(
    hiddenCapoMarkup,
    /tv-fretboard__marker tv-fretboard__marker--capo">2</,
  );
  assert.doesNotMatch(
    hiddenCapoMarkup,
    /tv-fretboard__marker tv-fretboard__marker--capo">3</,
  );
});

test("integration: micro fret marker abbreviations preserve multi-part identity cues", () => {
  const nineteenTet = findSystemByEdo(TUNINGS, 19)?.system;
  assert.ok(nineteenTet, "expected 19-TET system to resolve");

  const markup = renderToStaticMarkup(
    React.createElement(Fretboard, {
      strings: 1,
      frets: 36,
      tuning: ["E"],
      rootIx: 0,
      intervals: [0, 1, 2, 3, 4, 5, 6, 7],
      accidental: "sharp",
      noteNaming: "english",
      microLabelStyle: "fractions",
      show: "fret",
      showOpen: true,
      showFretNums: true,
      dotSize: 8,
      lefty: false,
      system: nineteenTet,
      chordPCs: null,
      chordRootPc: null,
      openOnlyInScale: false,
      colorByDegree: false,
      hideNonChord: false,
      stringMeta: null,
      boardMeta: null,
      capoFret: 0,
      onSetCapo: () => {},
    }),
  );

  const microMarkerTexts = Array.from(
    markup.matchAll(
      /class="[^"]*\btv-fretboard__marker\b[^"]*\btv-fretboard__marker--micro\b[^"]*"[^>]*>([^<]+)</g,
    ),
    (match) => match[1],
  );

  assert.ok(
    microMarkerTexts.length > 0,
    "expected rendered micro fret markers",
  );
  microMarkerTexts.forEach((text) => {
    assert.ok(
      text.length > 1,
      `expected micro marker "${text}" to keep multi-character identity`,
    );
  });
});

test("integration: dense marker overlap hides non-capo labels while preserving capo marker", () => {
  const nineteenTet = findSystemByEdo(TUNINGS, 19)?.system;
  assert.ok(nineteenTet, "expected 19-TET system to resolve");

  const capoFret = 9;
  const markup = renderToStaticMarkup(
    React.createElement(Fretboard, {
      strings: 1,
      frets: 48,
      tuning: ["E"],
      rootIx: 0,
      intervals: [0, 1, 2, 3, 4, 5, 6, 7],
      accidental: "sharp",
      noteNaming: "english",
      microLabelStyle: "fractions",
      show: "fret",
      showOpen: true,
      showFretNums: true,
      dotSize: 8,
      lefty: false,
      system: nineteenTet,
      chordPCs: null,
      chordRootPc: null,
      openOnlyInScale: false,
      colorByDegree: false,
      hideNonChord: false,
      stringMeta: null,
      boardMeta: null,
      capoFret,
      onSetCapo: () => {},
    }),
  );

  const markerCount = (
    markup.match(/class="[^"]*\btv-fretboard__marker\b[^"]*"/g) ?? []
  ).length;
  assert.ok(
    markerCount < 49,
    `expected overlap filtering to hide at least one marker, got ${markerCount}`,
  );

  const capoLabel = buildFretLabel(capoFret, nineteenTet.divisions, {
    microStyle: "fractions",
    accidental: "sharp",
  });

  assert.match(markup, /tv-fretboard__marker tv-fretboard__marker--capo/);
  assert.ok(markup.includes(`>${capoLabel}<`));
});
