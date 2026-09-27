import { buildFretLabel } from "@shared/lib/fretLabels";
import {
  isNoteVisible,
  resolveNoteFill,
} from "@features/fretboard/model/noteAppearance";
import { applyShapeRegionColors } from "@features/fretboard/model/shapeRegions";
import {
  fitFretMarkerLabel,
  placeFretMarkerLabels,
  placeNoteLabels,
} from "@features/fretboard/model/labelPlacement";
import {
  MARKER_FONT_MAX,
  MARKER_FONT_MIN,
} from "@features/fretboard/model/labelFit";

const ROOT_NOTE_RADIUS_MULTIPLIER = 1.1;
const CHORD_NOTE_RADIUS_MULTIPLIER = 1.05;

/**
 * X position of the note slot of every fret, centered between the fret wire
 * and the previous *visible* wire (hidden frets don't split the space). The
 * fret space right after the nut starts at the nut's right edge.
 */
export function buildBetweenVisibleFretsX({
  frets,
  visibleFrets,
  betweenFretsX,
  wireX,
  capoFret,
  nutW,
}) {
  const xByFret = Array.from({ length: frets + 1 }, (_, fret) =>
    betweenFretsX(fret),
  );
  if (frets < 1) return xByFret;

  let prevVisible = 0;
  let visibleIndex = 0;
  const visibleCount = visibleFrets.length;

  for (let fret = 1; fret <= frets; fret += 1) {
    while (visibleIndex < visibleCount && visibleFrets[visibleIndex] < fret) {
      prevVisible = visibleFrets[visibleIndex];
      visibleIndex += 1;
    }

    if (visibleIndex < visibleCount && visibleFrets[visibleIndex] === fret) {
      const leftX = wireX(prevVisible) + (prevVisible === capoFret ? nutW : 0);
      xByFret[fret] = (leftX + wireX(fret)) / 2;
    }
  }

  return xByFret;
}

/** Pitch class of each string's first playable position. */
export function buildOpenPcByString({
  strings,
  tuning,
  startFretFor,
  divisions,
  pcForName,
}) {
  const N = Math.max(1, divisions);
  return Array.from(
    { length: strings },
    (_, s) => (pcForName(tuning[s]) + startFretFor(s)) % N,
  );
}

/**
 * Every playable note slot on the board, with its position. Hidden frets and
 * the unplayable part of partial strings (stringMeta.startFret) are skipped.
 */
export function buildNoteGeometry({
  strings,
  frets,
  startFretFor,
  yForString,
  isFretHidden,
  openXForString,
  notePlacementMode,
  wireX,
  betweenVisibleFretsX,
}) {
  const out = [];
  for (let s = 0; s < strings; s += 1) {
    const sf = startFretFor(s);
    const cy = yForString(s);
    for (let f = 0; f <= frets; f += 1) {
      if (isFretHidden(f)) continue;
      const isOpen = f === 0;
      const isPlayable = sf === 0 || isOpen || f > sf;
      if (!isPlayable) continue;
      const cx = isOpen
        ? openXForString(s)
        : notePlacementMode === "onFret"
          ? wireX(f)
          : betweenVisibleFretsX(f);
      const step = isOpen ? 0 : sf === 0 ? f : f - sf;
      out.push({ key: `${s}-${f}`, s, f, sf, step, cy, cx, isOpen });
    }
  }
  return out;
}

/**
 * The notes to draw: which slots are visible, and each note's pitch class,
 * size, fill, label and chord markings. Labels are then fitted and placed.
 */
export function buildRenderedNotes({
  noteGeometry,
  openPcByString,
  divisions,
  strings,
  accidental,
  activeIntervals,
  scaleSet,
  rootIx,
  chordPCs,
  chordRootPc,
  display,
  dotSize,
  degreeForPc,
  labelFor,
  microLabelOpts,
  fitLabel,
  measureWidth,
}) {
  if (!activeIntervals.length) return [];
  const N = divisions;
  const hasChord = Boolean(chordPCs);
  const baseNotes = [];

  for (const slot of noteGeometry) {
    const pc = (openPcByString[slot.s] + slot.step) % N;
    const inScale = scaleSet.has(pc);
    const inChord = hasChord && chordPCs.has(pc);
    const visible = isNoteVisible({
      isOpen: slot.isOpen,
      inScale,
      inChord,
      hasChord,
      showOpen: display.showOpen,
      hideNonChord: display.hideNonChord,
      openOnlyInMode: display.openOnlyInMode,
      showAllNotes: display.showAllNotes,
    });
    if (!visible) continue;

    const isRoot = pc === rootIx;
    // Open notes always have slot.f === 0, which would always read as
    // "standard" — for a string whose true position is offset by
    // stringMeta.startFret (non-12-TET partial-fret setups), the open
    // note's actual fret is slot.sf, matching the correction the label
    // below needs too, so both share this one computation.
    const globalFretForLabel = slot.isOpen ? slot.sf : slot.f;
    const isStandard = (globalFretForLabel * 12) % N === 0;
    const isMicro = !isStandard;
    const rBase = (isRoot ? ROOT_NOTE_RADIUS_MULTIPLIER : 1) * dotSize;
    const r = inChord ? rBase * CHORD_NOTE_RADIUS_MULTIPLIER : rBase;
    const isChordRoot = inChord && chordRootPc === pc;
    const isChordOutsideScale = inChord && !inScale;
    const fill = resolveNoteFill({
      colorByDegree: display.colorByDegree,
      degree: display.colorByDegree ? degreeForPc(pc) : null,
      degreeCount: activeIntervals.length,
      isRoot,
      isMicro,
      isChordOutsideScale,
      isOutsideScale: !inScale,
    });
    const label =
      display.show === "fret"
        ? buildFretLabel(globalFretForLabel, N, microLabelOpts)
        : labelFor(pc, slot.f);

    baseNotes.push({
      ...slot,
      pc,
      isRoot,
      isStandard,
      isMicro,
      inChord,
      isChordRoot,
      isChordOutsideScale,
      r,
      fill,
      label,
    });
  }

  if (display.colorByShape) {
    applyShapeRegionColors(baseNotes, {
      divisions: N,
      strings,
      rootIx,
    });
  }

  return placeNoteLabels(baseNotes, {
    splitEnharmonic: accidental === "both" && display.show === "names",
    fitLabel,
    measureWidth,
  });
}

/**
 * Fret number markers: each visible fret's label, fitted to the space
 * between its neighbours, then placed without overlaps (the capo's marker
 * always stays).
 */
export function buildFretMarkers({
  visibleFrets,
  divisions,
  microLabelOpts,
  betweenVisibleFretsX,
  padLeft,
  boardEndX,
  wireX,
  capoFret,
  fitLabel,
  measureWidth,
}) {
  const baseMarkers = visibleFrets.map((f, index) => {
    const leftBoundary =
      index === 0 ? padLeft : (wireX(visibleFrets[index - 1]) + wireX(f)) / 2;
    const rightBoundary =
      index === visibleFrets.length - 1
        ? boardEndX
        : (wireX(f) + wireX(visibleFrets[index + 1])) / 2;
    const maxWidth = Math.max(6, (rightBoundary - leftBoundary) * 0.9);
    const fit = fitFretMarkerLabel(
      fitLabel,
      buildFretLabel(f, divisions, microLabelOpts),
      maxWidth,
      MARKER_FONT_MAX,
    );

    return {
      fret: f,
      xForFretNum: betweenVisibleFretsX(f),
      maxWidth,
      labelNum: fit?.text ?? null,
      markerFontSize: fit?.fontSize ?? MARKER_FONT_MIN,
    };
  });

  return placeFretMarkerLabels(baseMarkers, {
    capoFret,
    fitLabel,
    measureWidth,
  });
}
