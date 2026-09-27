import { findDistinctWindowShapeOccurrences } from "@domain/theory/fretboardShapes";
import { getShapeColor } from "@shared/lib/shapeColors";

function findShapeRegionStarts(notes, { divisions, strings, rootIx }) {
  let fretMin = notes[0].f;
  let fretMax = notes[0].f;
  for (const note of notes) {
    if (note.f < fretMin) fretMin = note.f;
    if (note.f > fretMax) fretMax = note.f;
  }
  const windowWidth = Math.max(2, Math.round(divisions / 4));
  const minShapeNotes = Math.max(2, Math.floor(strings / 2));
  const shapeInputNotes = notes.map((note) => ({
    string: note.s,
    fret: note.f,
    pc: note.pc,
    degree: (note.pc - rootIx + divisions) % divisions,
    isRoot: note.isRoot,
  }));
  const { occurrences } = findDistinctWindowShapeOccurrences(shapeInputNotes, {
    fretMin,
    fretMax,
    width: windowWidth,
    minNotes: minShapeNotes,
    requireRoot: true,
  });

  const rawStarts = [
    ...new Set(
      occurrences
        .map((occurrence) => occurrence.startFret)
        .sort((a, b) => a - b),
    ),
  ];
  const regionStarts = [];
  for (const start of rawStarts) {
    const previous = regionStarts[regionStarts.length - 1];
    if (previous == null || start - previous >= windowWidth) {
      regionStarts.push(start);
    }
  }
  if (regionStarts.length === 0) {
    regionStarts.push(fretMin);
  }
  return { regionStarts, windowWidth };
}

function regionMembershipsForNote(note, regionStarts, windowWidth) {
  const memberships = [];
  for (let i = 0; i < regionStarts.length; i += 1) {
    const start = regionStarts[i];
    if (note.f >= start && note.f <= start + windowWidth) {
      memberships.push(i);
    }
  }
  if (memberships.length === 0) {
    for (let i = 0; i < regionStarts.length; i += 1) {
      if (note.f >= regionStarts[i]) note.shapeRegionIndex = i;
      else break;
    }
    memberships.push(note.shapeRegionIndex ?? 0);
  }
  return memberships;
}

/**
 * Colors notes by the fretboard shape region(s) they fall in, mutating each
 * note's `fill`, `shapeSplitFills` and `splitByShape`. Notes in two
 * overlapping regions get a two-color split fill.
 */
export function applyShapeRegionColors(notes, options) {
  if (notes.length === 0) return;
  const { regionStarts, windowWidth } = findShapeRegionStarts(notes, options);

  for (const note of notes) {
    if (note.isChordOutsideScale) continue;
    const shapeFills = regionMembershipsForNote(note, regionStarts, windowWidth)
      .map((regionIndex) => getShapeColor(regionIndex))
      .filter((fill, index, all) => all.indexOf(fill) === index)
      .slice(0, 2);

    note.fill = shapeFills[0];
    note.shapeSplitFills = shapeFills;
    note.splitByShape = shapeFills.length > 1;
  }
}
