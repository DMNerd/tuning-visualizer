/**
 * Selector path contracts used by the URL share encoder.
 *
 * Intentionally excluded from this contract:
 * - display/chord/capo/metronome preferences (user-specific preferences)
 * - modal open/close UI state (ephemeral and per-session)
 * - queued preset workflow state (staging-only, not canonical configuration)
 * - transient workflow flags (e.g. touch/rehydrate markers used internally)
 */
export const SHARE_FIELD_SELECTORS = {
  // Included even though conceptually part of theory, because instrument setup
  // must resolve within a known system.
  systemId: "theory.system.systemId",
  strings: "instrument.instrumentState.strings",
  frets: "instrument.instrumentState.frets",
  tuning: "instrument.instrumentState.tuning",
  stringMeta: "instrument.instrumentState.stringMeta",
  boardMeta: "instrument.instrumentState.boardMeta",
  kgNeckFilterEnabled: "instrument.instrumentState.kgNeckFilterEnabled",
  selectedPreset: "instrument.presets.selectedPreset",
  customTunings: "instrument.customTunings",
} as const;
