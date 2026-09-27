import { isPlainObject } from "@shared/lib/object";

export const KG_NECK_HIDDEN_FRETS = Object.freeze([1, 5, 11, 15, 19, 23]);
export const NECK_FILTER_MODES = Object.freeze({
  NONE: "none",
  KG: "kg",
  FRETLESS: "fretless",
} as const);
export const FRETLESS_BOARD_META = Object.freeze({
  fretStyle: "dotted",
  notePlacement: "onFret",
} as const);

export type NeckFilterModeId =
  (typeof NECK_FILTER_MODES)[keyof typeof NECK_FILTER_MODES];

export type NeckFilterContext = {
  mode?: unknown;
  edo?: number | null;
  strings?: number | null;
  boardMeta?: unknown;
};

export interface NeckFilterModeDef {
  id: NeckFilterModeId;
  label: string;
  isApplicable: (context: NeckFilterContext) => boolean;
  apply: (
    boardMeta: unknown,
    context: NeckFilterContext,
  ) => Record<string, unknown> | null;
  detectFromPreset?: (boardMeta: unknown) => boolean;
}

export type NeckFilterOption = {
  value: NeckFilterModeId;
  label: string;
  disabled: boolean;
};

function nonEmptyOrNull(
  value: Record<string, unknown>,
): Record<string, unknown> | null {
  return Object.keys(value).length > 0 ? value : null;
}

function normalizeHiddenFretList(hiddenFrets: unknown): number[] {
  if (!Array.isArray(hiddenFrets)) return [];
  return hiddenFrets
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0)
    .sort((a, b) => a - b);
}

export function isFretlessBoardMeta(boardMeta: unknown): boolean {
  if (!isPlainObject(boardMeta)) return false;
  return (
    boardMeta.fretStyle === FRETLESS_BOARD_META.fretStyle &&
    boardMeta.notePlacement === FRETLESS_BOARD_META.notePlacement
  );
}

export function hasKgNeckFilterMeta(boardMeta: unknown): boolean {
  if (!isPlainObject(boardMeta)) return false;
  const normalized = normalizeHiddenFretList(boardMeta.hiddenFrets);
  if (normalized.length !== KG_NECK_HIDDEN_FRETS.length) return false;
  return KG_NECK_HIDDEN_FRETS.every(
    (value, index) => normalized[index] === value,
  );
}

export function stripHiddenFrets(
  boardMeta: unknown,
): Record<string, unknown> | null {
  if (!isPlainObject(boardMeta)) return null;
  const { hiddenFrets: _hiddenFrets, ...rest } = boardMeta;
  return nonEmptyOrNull(rest);
}

function stripHiddenFretsIfKg<T>(
  boardMeta: T,
): T | Record<string, unknown> | null {
  return hasKgNeckFilterMeta(boardMeta)
    ? stripHiddenFrets(boardMeta)
    : boardMeta;
}

export function stripFretlessStyle(
  boardMeta: unknown,
): Record<string, unknown> | null {
  if (!isPlainObject(boardMeta)) return null;
  if (!isFretlessBoardMeta(boardMeta)) return nonEmptyOrNull({ ...boardMeta });
  const {
    fretStyle: _fretStyle,
    notePlacement: _notePlacement,
    ...rest
  } = boardMeta;
  return nonEmptyOrNull(rest);
}

export function normalizeNeckFilterModeId(mode: unknown): NeckFilterModeId {
  return coerceNeckFilterMode(mode, NECK_FILTER_MODES.NONE);
}

const NECK_FILTER_MODE_IDS: ReadonlySet<unknown> = new Set(
  Object.values(NECK_FILTER_MODES),
);

export function isNeckFilterMode(value: unknown): value is NeckFilterModeId {
  return NECK_FILTER_MODE_IDS.has(value);
}

export function coerceNeckFilterMode(
  value: unknown,
  fallback: NeckFilterModeId = NECK_FILTER_MODES.NONE,
): NeckFilterModeId {
  if (isNeckFilterMode(value)) return value;
  return isNeckFilterMode(fallback) ? fallback : NECK_FILTER_MODES.NONE;
}

export const NECK_FILTER_MODE_DEFS: readonly NeckFilterModeDef[] =
  Object.freeze([
    {
      id: NECK_FILTER_MODES.NONE,
      label: "None",
      isApplicable: () => true,
      apply: (boardMeta) => stripFretlessStyle(stripHiddenFretsIfKg(boardMeta)),
    },
    {
      id: NECK_FILTER_MODES.KG,
      label: "KG",
      isApplicable: ({ edo, boardMeta }) =>
        Number(edo) === 24 && !isFretlessBoardMeta(boardMeta),
      apply: (boardMeta, context) => {
        const normalizedBoardMeta = isPlainObject(boardMeta) ? boardMeta : null;
        if (
          Number(context?.edo) !== 24 ||
          isFretlessBoardMeta(normalizedBoardMeta)
        ) {
          return stripHiddenFretsIfKg(normalizedBoardMeta);
        }
        return {
          ...(stripHiddenFrets(normalizedBoardMeta) ?? {}),
          hiddenFrets: [...KG_NECK_HIDDEN_FRETS],
        };
      },
      detectFromPreset: hasKgNeckFilterMeta,
    },
    {
      id: NECK_FILTER_MODES.FRETLESS,
      label: "Fretless",
      isApplicable: () => true,
      apply: (boardMeta) => ({
        ...(stripHiddenFrets(stripFretlessStyle(boardMeta)) ?? {}),
        ...FRETLESS_BOARD_META,
      }),
      detectFromPreset: isFretlessBoardMeta,
    },
  ]);

const MODE_DEF_MAP = Object.freeze(
  Object.fromEntries(NECK_FILTER_MODE_DEFS.map((def) => [def.id, def])),
) as Record<NeckFilterModeId, NeckFilterModeDef>;

export function getNeckFilterModeDef(mode: unknown): NeckFilterModeDef {
  return MODE_DEF_MAP[normalizeNeckFilterModeId(mode)];
}

export function applyNeckFilterModeToBoardMeta(
  boardMeta: unknown,
  {
    mode,
    edo,
    strings,
  }: {
    mode?: unknown;
    edo?: number | null;
    strings?: number | null;
  },
): Record<string, unknown> | null {
  return getNeckFilterModeDef(mode).apply(boardMeta, {
    mode,
    edo,
    strings,
    boardMeta,
  });
}

export function shouldApplyNeckFilterMode({
  mode,
  edo,
  boardMeta,
}: NeckFilterContext & { mode?: unknown }): boolean {
  return getNeckFilterModeDef(mode).isApplicable({ mode, edo, boardMeta });
}

export function detectNeckFilterModeFromPreset(
  boardMeta: unknown,
): NeckFilterModeId | null {
  const matched = NECK_FILTER_MODE_DEFS.find(
    (def) => def.detectFromPreset && def.detectFromPreset(boardMeta),
  );
  return matched?.id ?? null;
}

/**
 * Resolve the intended preset mode from board metadata.
 *
 * Precedence:
 * 1) Explicit `board.neckFilterMode` intent (canonical)
 * 2) Legacy structural pattern detection fallback (KG hidden frets / fretless style)
 */
export function resolveNeckFilterModeIntentFromBoardMeta(
  boardMeta: unknown,
): NeckFilterModeId | null {
  if (isPlainObject(boardMeta)) {
    const explicit = normalizeNeckFilterModeId(boardMeta.neckFilterMode);
    if (
      explicit !== NECK_FILTER_MODES.NONE ||
      boardMeta.neckFilterMode === "none"
    ) {
      return explicit;
    }
  }
  return detectNeckFilterModeFromPreset(boardMeta);
}

/**
 * `presetAppliedMode` is the mode the previous preset's meta applied. If it is
 * still active when a preset with no intent of its own is selected, it is
 * dropped rather than carried over; a mode the user picked by hand is kept.
 */
export function resolvePresetNeckFilterMode({
  presetMode,
  syncFromPresetMeta,
  currentMode,
  presetAppliedMode,
  currentEdo,
  boardMeta,
}: {
  presetMode?: unknown;
  syncFromPresetMeta: boolean;
  currentMode?: unknown;
  presetAppliedMode?: unknown;
  currentEdo?: number | null;
  boardMeta?: unknown;
}): NeckFilterModeId {
  const carriedMode =
    syncFromPresetMeta &&
    !presetMode &&
    presetAppliedMode === normalizeNeckFilterModeId(currentMode)
      ? NECK_FILTER_MODES.NONE
      : currentMode;
  const modeToValidate = presetMode ?? carriedMode;
  const presetAllowsMode = shouldApplyNeckFilterMode({
    mode: modeToValidate,
    edo: currentEdo,
    boardMeta: boardMeta ?? null,
  });

  if (!presetAllowsMode) {
    return NECK_FILTER_MODES.NONE;
  }
  if (presetMode && syncFromPresetMeta) {
    return normalizeNeckFilterModeId(presetMode);
  }
  return normalizeNeckFilterModeId(carriedMode);
}

export function getNeckFilterOptions(
  context: NeckFilterContext = {},
): NeckFilterOption[] {
  const optionOrder: readonly NeckFilterModeId[] = [
    NECK_FILTER_MODES.NONE,
    NECK_FILTER_MODES.FRETLESS,
    NECK_FILTER_MODES.KG,
  ];
  return optionOrder.map((modeId) => {
    const def = MODE_DEF_MAP[modeId];
    return {
      value: def.id,
      label: def.label,
      disabled: !def.isApplicable(context),
    };
  });
}

export function sanitizeBoardMetaForModeStorage(
  boardMeta: unknown,
): Record<string, unknown> | null {
  if (!isPlainObject(boardMeta)) return null;

  const normalized = { ...boardMeta };
  if (normalized.neckFilterMode === NECK_FILTER_MODES.FRETLESS) {
    if (normalized.fretStyle === FRETLESS_BOARD_META.fretStyle) {
      delete normalized.fretStyle;
    }
    if (normalized.notePlacement === FRETLESS_BOARD_META.notePlacement) {
      delete normalized.notePlacement;
    }
  }

  return nonEmptyOrNull(normalized);
}
