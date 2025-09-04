import { useMemo } from "react";

/**
 * Geometry/layout for the fretboard SVG.
 *
 * - Visual spacing consistent across systems (linear per-fret width).
 * - Fret width adapts smoothly to total fret count (fewer frets => wider).
 * - Layout is independent of dot size (no zoom), except:
 *   open-note X uses dotSize to sit nicely *behind the nut*.
 */
export function useFretboardLayout({ frets, strings, dotSize = 14 }) {
  const NUT_W = 16;

  // Horizontal scaling
  const BASE_FRET_W = 54;
  const MIN_FRET_W = 42;
  const MAX_FRET_W = 64;
  const scale = 18 / Math.max(frets, 18);
  const FRET_W = Math.round(
    Math.min(MAX_FRET_W, Math.max(MIN_FRET_W, BASE_FRET_W * scale)),
  );

  const STRING_GAP = 56;

  const FRETNUM_TOP_GAP = 22;
  const FRETNUM_BOTTOM_GAP = 30;

  // Open-note clearance
  const OPEN_OFFSET = Math.max(10, dotSize * 1.2);
  const OPEN_MARGIN = Math.ceil(NUT_W / 2 + OPEN_OFFSET + dotSize + 6);

  const PAD = {
    left: Math.max(26, OPEN_MARGIN),
    right: 26,
    top: 16 + FRETNUM_TOP_GAP,
    bottom: 16 + FRETNUM_BOTTOM_GAP,
  };

  return useMemo(() => {
    const boardW = frets * FRET_W;
    const boardH = (strings - 1) * STRING_GAP;

    const width = PAD.left + NUT_W + boardW + PAD.right;
    const height = PAD.top + boardH + PAD.bottom;

    const fretXs = Array.from({ length: frets }, (_, f) => (f + 1) * FRET_W);

    const boardStartX = PAD.left + NUT_W;
    const boardEndX = boardStartX + boardW;

    const wireX = (f) => (f === 0 ? PAD.left : boardStartX + fretXs[f - 1]);

    const betweenFretsX = (f) => {
      if (f === 0) return PAD.left + NUT_W / 2; // inside the nut
      const prev = f === 1 ? 0 : fretXs[f - 2];
      const curr = fretXs[f - 1];
      return boardStartX + (prev + curr) / 2;
    };

    const noteCenterX = (f) =>
      f === 0 ? PAD.left - (NUT_W / 2 + OPEN_OFFSET) : betweenFretsX(f);

    const yForString = (s) => PAD.top + s * STRING_GAP;

    return {
      width,
      height,
      nutW: NUT_W,
      padTop: PAD.top,
      padBottom: PAD.bottom,
      padLeft: PAD.left,
      padRight: PAD.right,
      boardEndX,
      fretXs,
      wireX,
      betweenFretsX,
      noteCenterX,
      yForString,
      FRETNUM_TOP_GAP,
      FRETNUM_BOTTOM_GAP,
    };
  }, [frets, strings, dotSize, FRET_W, STRING_GAP, PAD]);
}
