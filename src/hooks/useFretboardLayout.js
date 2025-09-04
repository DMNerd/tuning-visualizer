// src/components/Fretboard/useFretboardLayout.js
import { useMemo } from "react";
import { buildFrets } from "@/components/Fretboard/geometry";

/**
 * Encapsulates all fretboard geometry & layout math.
 * Returns stable helpers and metrics derived from (frets, dotSize, system, strings).
 */
export function useFretboardLayout({ frets, dotSize, system, strings }) {
  const nutW = 16;
  const stringGap = 56;
  const padRight = 12;

  // Fret-number offsets react to dot size
  const FRETNUM_TOP_GAP = Math.max(18, dotSize * 0.9 + 6);
  const FRETNUM_BOTTOM_GAP = Math.max(28, dotSize * 1.1 + 8);

  // Paddings large enough to accommodate the numbers
  const padTop = Math.max(28, FRETNUM_TOP_GAP + 12);
  const padBottom = Math.max(36, FRETNUM_BOTTOM_GAP + 12);

  // Open-note margin reacts to dot size so labels don’t overlap the nut
  const openNoteMargin = dotSize * 3;
  const padLeft = 24 + openNoteMargin;

  // Wire positions (x) for the current temperament
  const fullScaleLen = useMemo(() => 56 * frets, [frets]);
  const fretXs = useMemo(
    () => buildFrets(fullScaleLen, frets, system),
    [fullScaleLen, frets, system],
  );

  // Extra space beyond the last wire so the board doesn’t look chopped
  const lastWire = fretXs[fretXs.length - 1] ?? 0;
  const prevWire = fretXs[fretXs.length - 2] ?? lastWire - fullScaleLen * 0.03;
  const lastGap = Math.max(8, lastWire - prevWire);
  const drawScaleLen = lastWire + lastGap * 1.1;

  const width = padLeft + nutW + drawScaleLen + padRight;
  const height = padTop + padBottom + stringGap * (strings - 1);
  const boardEndX = padLeft + nutW + drawScaleLen;

  // Helpers
  const wireX = (f) => padLeft + nutW + (f === 0 ? 0 : fretXs[f - 1]);

  const betweenFretsX = (f) => {
    if (f === 0) return padLeft + nutW / 2;
    const prev = f === 1 ? 0 : fretXs[f - 2];
    const curr = fretXs[f - 1];
    return padLeft + nutW + (prev + curr) / 2;
  };

  const noteCenterX = (f) => {
    if (f === 0) return padLeft - dotSize * 1.5;
    const prev = f === 1 ? 0 : fretXs[f - 2];
    const curr = fretXs[f - 1];
    return padLeft + nutW + (prev + curr) / 2;
  };

  const yForString = (s) => padTop + s * stringGap;

  return {
    // metrics
    width,
    height,
    nutW,
    padTop,
    padBottom,
    padLeft,
    boardEndX,
    fretXs,
    drawScaleLen,

    // numbers positioning
    FRETNUM_TOP_GAP,
    FRETNUM_BOTTOM_GAP,

    // helpers
    wireX,
    betweenFretsX,
    noteCenterX,
    yForString,
  };
}
