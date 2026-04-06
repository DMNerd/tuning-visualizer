import { isPlainObject } from "@/utils/object";

export const KG_NECK_HIDDEN_FRETS = Object.freeze([1, 5, 11, 15, 19, 23]);

export function isFretlessBoardMeta(boardMeta) {
  if (!isPlainObject(boardMeta)) return false;
  return (
    boardMeta.fretStyle === "dotted" && boardMeta.notePlacement === "onFret"
  );
}

export function shouldApplyKgNeckFilter({ enabled, edo, strings, boardMeta }) {
  if (!enabled) return false;
  if (Number(edo) !== 24) return false;
  if (Number(strings) !== 6) return false;
  if (isFretlessBoardMeta(boardMeta)) return false;
  return true;
}

export function applyKgNeckFilterToBoardMeta(
  boardMeta,
  { enabled, edo, strings },
) {
  const normalizedBoardMeta = isPlainObject(boardMeta) ? boardMeta : null;
  if (
    !shouldApplyKgNeckFilter({
      enabled,
      edo,
      strings,
      boardMeta: normalizedBoardMeta,
    })
  ) {
    return normalizedBoardMeta;
  }

  return {
    ...(normalizedBoardMeta ?? {}),
    hiddenFrets: [...KG_NECK_HIDDEN_FRETS],
  };
}
