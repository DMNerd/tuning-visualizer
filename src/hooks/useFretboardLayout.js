import { useMemo, useState, useEffect } from "react";
import { toStringMetaMap } from "@/lib/meta/meta";

/**
 * Geometry/layout for the fretboard SVG.
 */
export function useFretboardLayout({
  frets,
  strings,
  dotSize = 14,
  stringMeta = null,
}) {
  const [metaByIndex, setMetaByIndex] = useState(() =>
    toStringMetaMap(stringMeta),
  );

  useEffect(() => {
    setMetaByIndex(toStringMetaMap(stringMeta));
  }, [stringMeta]);

  return useMemo(() => {
    const NUT_W = 16;
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
      if (f === 0) return PAD.left + NUT_W / 2;
      const prev = f === 1 ? 0 : fretXs[f - 2];
      const curr = fretXs[f - 1];
      return boardStartX + (prev + curr) / 2;
    };
    const yForString = (s) => PAD.top + s * STRING_GAP;
    const startFretFor = (s) => metaByIndex.get(s)?.startFret ?? 0;
    const stringStartX = (s) => {
      const sf = startFretFor(s);
      return sf > 0 ? wireX(sf) : PAD.left;
    };
    const openXForString = (s) => {
      const sf = startFretFor(s);
      return sf > 0 ? betweenFretsX(sf) : PAD.left - (NUT_W / 2 + OPEN_OFFSET);
    };
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
      startFretFor,
      stringStartX,
      openXForString,
      noteX,
    };
  }, [frets, strings, dotSize, metaByIndex]);
}
