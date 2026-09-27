import { getDegreeColor } from "@shared/lib/degreeColors";

export function isNoteVisible({
  isOpen,
  inScale,
  inChord,
  hasChord,
  showOpen,
  hideNonChord,
  openOnlyInMode,
  showAllNotes = false,
}) {
  // Open notes only ever count toward visibility when showOpen is on —
  // shared by the chord-overlay term below and the hideNonChord branch.
  const openVisible = !isOpen || showOpen;
  if (showAllNotes) return openVisible;
  if (hideNonChord && hasChord) return openVisible && inChord;

  const isOverlayOutsideScaleChord =
    hasChord && inChord && !inScale && openVisible;
  // openOnlyInMode === "chord" only restricts opens while a chord is
  // actually overlaid (hasChord) — with no chord active it would hide
  // every open string, since inChord is always false without one.
  const baselineVisible = isOpen
    ? showOpen &&
      (openOnlyInMode !== "scale" || inScale) &&
      (openOnlyInMode !== "chord" || !hasChord || inChord)
    : inScale;
  return baselineVisible || isOverlayOutsideScaleChord;
}

export function resolveNoteFill({
  colorByDegree,
  degree,
  degreeCount,
  isRoot,
  isMicro,
  isChordOutsideScale,
  isOutsideScale = false,
}) {
  if (isChordOutsideScale) return "var(--chord-outside-fill)";
  if (isOutsideScale) return "var(--note-outside)";
  const plainFill = isMicro ? "var(--note-micro)" : "var(--note)";
  if (colorByDegree) {
    return degree != null ? getDegreeColor(degree, degreeCount) : plainFill;
  }
  return isRoot ? "var(--root)" : plainFill;
}
