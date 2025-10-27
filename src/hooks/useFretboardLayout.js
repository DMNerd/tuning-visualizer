import { useMemo } from "react";
import { toStringMetaMap } from "@/lib/meta/meta";

/**
 * Geometry/layout for the fretboard SVG.
 *
 * - Visual spacing consistent across systems (linear per-fret width).
 * - Fret width adapts smoothly to total fret count (fewer frets => wider).
 * - Layout is independent of dot size (no zoom), except:
 *   open-note X uses dotSize to sit nicely *behind the nut*.
 *
 * Per-string metadata:
 * - stringMeta: [{ index, startFret?, greyBefore? }]
 *   When provided, helpers (stringStartX, noteX) respect per-string start frets.
 */
export function useFretboardLayout({
  frets,
  strings,
  dotSize = 14,
  stringMeta = null,
}) {
  return useMemo(() => {
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

    // Open-note clearance (depends on dotSize)
    const OPEN_OFFSET = Math.max(10, dotSize * 1.2);
    const OPEN_MARGIN = Math.ceil(NUT_W / 2 + OPEN_OFFSET + dotSize + 6);

    const PAD = {
      left: Math.max(26, OPEN_MARGIN),
      right: 26,
      top: 16 + FRETNUM_TOP_GAP,
      bottom: 16 + FRETNUM_BOTTOM_GAP,
    };

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

    const yForString = (s) => PAD.top + s * STRING_GAP;

    // ---- Per-string metadata helpers ----
    const metaByIndex = toStringMetaMap(stringMeta);
    const startFretFor = (s) => metaByIndex.get(s)?.startFret ?? 0;

    const stringStartX = (s) => {
      const sf = startFretFor(s);
      return sf > 0 ? wireX(sf) : PAD.left;
    };

    // Open X for a given string: either at that string's first playable fret midpoint,
    // or behind the nut using the open-note offset geometry.
    const openXForString = (s) => {
      const sf = startFretFor(s);
      return sf > 0 ? betweenFretsX(sf) : PAD.left - (NUT_W / 2 + OPEN_OFFSET);
    };

    // General note X for (fret f, string s)
    const noteX = (f, s) => (f === 0 ? openXForString(s) : betweenFretsX(f));

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
      yForString,
      FRETNUM_TOP_GAP,
      FRETNUM_BOTTOM_GAP,

      // Per-string aware helpers
      startFretFor, // (s) -> first playable fret for string s
      stringStartX, // (s) -> x where the string's active line should begin
      openXForString, // (s) -> X for the "open" marker on that string
      noteX, // (f, s) -> X center for a note on fret f, string s
    };
  }, [frets, strings, dotSize, stringMeta]);
}
