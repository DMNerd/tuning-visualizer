export function normalizeHiddenFrets(hiddenFrets) {
  if (!Array.isArray(hiddenFrets) || hiddenFrets.length === 0) {
    return new Set();
  }

  return new Set(
    hiddenFrets.filter(
      (fret) =>
        typeof fret === "number" &&
        fret >= 0 &&
        Number.isInteger(fret) &&
        Number.isFinite(fret),
    ),
  );
}

export function isHiddenFret(hiddenFretSet, fretIndex) {
  // Open fret (0) remains visible by default and is only hidden when
  // explicitly included in `meta.board.hiddenFrets`.
  return hiddenFretSet.has(fretIndex);
}

export function buildRenderedFretIndices(maxFret, hiddenFretSet) {
  return Array.from({ length: maxFret + 1 }, (_, fret) => fret).filter(
    (fret) => !isHiddenFret(hiddenFretSet, fret),
  );
}

export function resolveVisibleCapoFret(capoFret, visibleFrets) {
  if (!Array.isArray(visibleFrets) || visibleFrets.length === 0) {
    return 0;
  }

  const capo =
    typeof capoFret === "number" && Number.isFinite(capoFret)
      ? Math.round(capoFret)
      : 0;

  if (visibleFrets.includes(capo)) {
    return capo;
  }

  let best = visibleFrets[0];
  let bestDistance = Math.abs(best - capo);

  for (let i = 1; i < visibleFrets.length; i += 1) {
    const candidate = visibleFrets[i];
    const distance = Math.abs(candidate - capo);
    if (
      distance < bestDistance ||
      (distance === bestDistance && candidate < best)
    ) {
      best = candidate;
      bestDistance = distance;
    }
  }

  return best;
}

export function reconcileCapoState(capoFret, safeCapoFret, onSetCapo) {
  const isNumericCapo =
    typeof capoFret === "number" && Number.isFinite(capoFret);
  if (!isNumericCapo || capoFret === safeCapoFret) {
    return false;
  }

  if (typeof onSetCapo === "function") {
    onSetCapo(safeCapoFret);
    return true;
  }

  return false;
}
