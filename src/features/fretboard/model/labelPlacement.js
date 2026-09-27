import {
  collides1D,
  collides2D,
  addBounds1D,
  addBounds2D,
} from "@features/fretboard/model/collisionGrid";
import {
  NOTE_FONT_MIN,
  NOTE_FONT_MAX,
  SPLIT_NOTE_FONT_MIN,
  SPLIT_NOTE_FONT_MAX,
  MARKER_FONT_MIN,
  MARKER_FONT_MAX,
  buildLabelVariants,
} from "@features/fretboard/model/labelFit";

const SPATIAL_BUCKET_SIZE = 36;
const NOTE_FONT_WEIGHT = 700;
const MARKER_FONT_WEIGHT = 500;

function fitNoteText(fitLabel, text, note, maxWidth, sizeRange) {
  return fitLabel(
    buildLabelVariants(text, {
      kind: "note",
      allowSingleCharFallback: note.isRoot,
    }),
    maxWidth,
    {
      sizeRange: { ...sizeRange, step: 0.5 },
      fontWeight: NOTE_FONT_WEIGHT,
      allowSingleCharFallback: note.isRoot,
    },
  );
}

// Enharmonic "C#/Db" labels are stacked on two lines inside the dot.
function fitSplitNoteLabel(note, { fitLabel, measureWidth }) {
  const [upperRaw = "", lowerRaw = ""] = note.label.split("/");
  const sizeRange = { min: SPLIT_NOTE_FONT_MIN, max: SPLIT_NOTE_FONT_MAX };
  const upperFit = fitNoteText(
    fitLabel,
    upperRaw,
    note,
    note.r * 0.9,
    sizeRange,
  );
  const lowerFit = fitNoteText(
    fitLabel,
    lowerRaw,
    note,
    note.r * 0.9,
    sizeRange,
  );
  if (!upperFit || !lowerFit) return null;

  const noteFontSize = Math.min(upperFit.fontSize, lowerFit.fontSize);
  const style = { fontSize: noteFontSize, fontWeight: NOTE_FONT_WEIGHT };
  return {
    renderedLabel: null,
    renderedLabelLines: [upperFit.text, lowerFit.text],
    noteFontSize,
    width: Math.max(
      measureWidth(upperFit.text, style),
      measureWidth(lowerFit.text, style),
    ),
    halfH: noteFontSize * 1.25,
  };
}

function fitSingleNoteLabel(note, { fitLabel, measureWidth }) {
  const fit = fitNoteText(fitLabel, note.label ?? "", note, note.r * 1.65, {
    min: NOTE_FONT_MIN,
    max: NOTE_FONT_MAX,
  });
  if (!fit) return null;
  return {
    renderedLabel: fit.text,
    renderedLabelLines: null,
    noteFontSize: fit.fontSize,
    width: measureWidth(fit.text, {
      fontSize: fit.fontSize,
      fontWeight: NOTE_FONT_WEIGHT,
    }),
    halfH: fit.fontSize / 2 + 1,
  };
}

/**
 * Fits each note's label inside its dot and drops labels that would overlap
 * an already-placed one. Roots and chord tones are placed first so they win
 * collisions; root labels are always kept.
 */
export function placeNoteLabels(
  notes,
  { splitEnharmonic, fitLabel, measureWidth },
) {
  const sorted = [...notes].sort((a, b) => {
    if (a.isRoot !== b.isRoot) return a.isRoot ? -1 : 1;
    if (a.inChord !== b.inChord) return a.inChord ? -1 : 1;
    return b.r - a.r;
  });
  const acceptedBoundsBuckets = new Map();
  const computed = new Map();
  const measure = { fitLabel, measureWidth };

  for (const note of sorted) {
    const shouldSplitEnharmonicLabel =
      splitEnharmonic &&
      typeof note.label === "string" &&
      note.label.includes("/");
    const fit = shouldSplitEnharmonicLabel
      ? fitSplitNoteLabel(note, measure)
      : fitSingleNoteLabel(note, measure);
    if (!fit) {
      computed.set(note.key, { ...note, renderedLabel: null });
      continue;
    }

    const halfW = fit.width / 2 + 1;
    const bounds = {
      left: note.cx - halfW,
      right: note.cx + halfW,
      top: note.cy - fit.halfH - 1,
      bottom: note.cy + fit.halfH + 1,
    };
    if (
      !note.isRoot &&
      collides2D(bounds, acceptedBoundsBuckets, SPATIAL_BUCKET_SIZE)
    ) {
      computed.set(note.key, { ...note, renderedLabel: null });
      continue;
    }

    addBounds2D(bounds, acceptedBoundsBuckets, SPATIAL_BUCKET_SIZE);
    computed.set(note.key, {
      ...note,
      renderedLabel: fit.renderedLabel,
      renderedLabelLines: fit.renderedLabelLines,
      noteFontSize: fit.noteFontSize,
      splitEnharmonic: shouldSplitEnharmonicLabel,
    });
  }

  return notes.map((note) => computed.get(note.key) ?? note);
}

export function fitFretMarkerLabel(fitLabel, label, maxWidth, maxFontSize) {
  return fitLabel(
    buildLabelVariants(label, { kind: "fret", allowSingleCharFallback: false }),
    maxWidth,
    {
      sizeRange: { min: MARKER_FONT_MIN, max: maxFontSize, step: 0.5 },
      fontWeight: MARKER_FONT_WEIGHT,
      allowSingleCharFallback: false,
    },
  );
}

/**
 * Resolves overlapping fret-number labels left to right: a colliding label is
 * retried one size step smaller, then dropped. The capo fret's label is never
 * shrunk or dropped.
 */
export function placeFretMarkerLabels(
  markers,
  { capoFret, fitLabel, measureWidth },
) {
  const acceptedBoundsBuckets = new Map();
  const boundsFor = (marker, label, fontSize) => {
    const width = measureWidth(label, {
      fontSize,
      fontWeight: MARKER_FONT_WEIGHT,
    });
    return {
      left: marker.xForFretNum - width / 2 - 1,
      right: marker.xForFretNum + width / 2 + 1,
    };
  };
  const collides = (bounds) =>
    collides1D(bounds, acceptedBoundsBuckets, SPATIAL_BUCKET_SIZE);

  return markers.map((marker) => {
    if (!marker.labelNum) return marker;

    let label = marker.labelNum;
    let fontSize = marker.markerFontSize;
    let bounds = boundsFor(marker, label, fontSize);

    if (collides(bounds) && marker.fret !== capoFret) {
      const downgradedFit = fitFretMarkerLabel(
        fitLabel,
        marker.labelNum,
        marker.maxWidth,
        Math.max(MARKER_FONT_MIN, marker.markerFontSize - 1.5),
      );
      if (!downgradedFit) return { ...marker, labelNum: null };

      label = downgradedFit.text;
      fontSize = downgradedFit.fontSize;
      bounds = boundsFor(marker, label, fontSize);
      if (collides(bounds)) return { ...marker, labelNum: null };
    }

    addBounds1D(bounds, acceptedBoundsBuckets, SPATIAL_BUCKET_SIZE);
    return { ...marker, labelNum: label, markerFontSize: fontSize };
  });
}
