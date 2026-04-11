import { isPlainObject } from "@/utils/object";

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
  return Object.keys(rest).length > 0 ? rest : null;
}

export function stripFretlessStyle(
  boardMeta: unknown,
): Record<string, unknown> | null {
  if (!isPlainObject(boardMeta)) return null;
  const next = { ...boardMeta } as Record<string, unknown>;
  if (
    next.fretStyle === FRETLESS_BOARD_META.fretStyle &&
    next.notePlacement === FRETLESS_BOARD_META.notePlacement
  ) {
    delete next.fretStyle;
    delete next.notePlacement;
  }
  return Object.keys(next).length > 0 ? next : null;
}

export function normalizeNeckFilterModeId(mode: unknown): NeckFilterModeId {
  return coerceNeckFilterMode(mode, NECK_FILTER_MODES.NONE);
}

export function isNeckFilterMode(value: unknown): value is NeckFilterModeId {
  return (
    value === NECK_FILTER_MODES.NONE ||
    value === NECK_FILTER_MODES.KG ||
    value === NECK_FILTER_MODES.FRETLESS
  );
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
      apply: (boardMeta) =>
        stripFretlessStyle(
          hasKgNeckFilterMeta(boardMeta)
            ? stripHiddenFrets(boardMeta)
            : boardMeta,
        ),
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
          return hasKgNeckFilterMeta(normalizedBoardMeta)
            ? stripHiddenFrets(normalizedBoardMeta)
            : normalizedBoardMeta;
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

export function resolvePresetNeckFilterMode({
  presetMode,
  syncFromPresetMeta,
  currentMode,
  currentEdo,
  boardMeta,
}: {
  presetMode?: unknown;
  syncFromPresetMeta: boolean;
  currentMode?: unknown;
  currentEdo?: number | null;
  boardMeta?: unknown;
}): NeckFilterModeId {
  const modeToValidate = presetMode ?? currentMode;
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
  return normalizeNeckFilterModeId(currentMode);
}

export function getNeckFilterOptions(
  context: NeckFilterContext = {},
): NeckFilterOption[] {
  return NECK_FILTER_MODE_DEFS.map((def) => ({
    value: def.id,
    label: def.label,
    disabled: !def.isApplicable(context),
  }));
}

export function sanitizeBoardMetaForModeStorage(
  boardMeta: unknown,
): Record<string, unknown> | null {
  if (!isPlainObject(boardMeta)) return null;

  const normalized = { ...boardMeta } as Record<string, unknown>;
  if (normalized.neckFilterMode === NECK_FILTER_MODES.FRETLESS) {
    if (normalized.fretStyle === FRETLESS_BOARD_META.fretStyle) {
      delete normalized.fretStyle;
    }
    if (normalized.notePlacement === FRETLESS_BOARD_META.notePlacement) {
      delete normalized.notePlacement;
    }
  }

  return Object.keys(normalized).length ? normalized : null;
}
