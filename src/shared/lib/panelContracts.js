/**
 * Shared panel contracts for App container boundaries.
 * These are documentation-first typedefs for grouped props.
 */

/**
 * @typedef {Object} InstrumentPanelContract
 * @property {Object} state
 * @property {Object} preset
 * @property {Object} handlers
 * @property {Object} reset
 */

/**
 * @typedef {Object} TheoryPanelContract
 * @property {Object} system
 * @property {Object} scale
 * @property {Object} chord
 * @property {Object} randomize
 * @property {Object} reset
 */

/**
 * @typedef {Object} PracticePanelContract
 * @property {Object} metronome
 * @property {Object} controls
 * @property {Object} reset
 */

/**
 * @typedef {Object} ExportPanelContract
 * @property {string} fileBase
 * @property {import('react').RefObject<HTMLElement>} boardRef
 * @property {Object} exporters
 * @property {Object} packActions
 */

/**
 * @typedef {Object} CustomTuningModalsContract
 * @property {Object} modal
 * @property {Array} customTunings
 * @property {Object} systems
 * @property {string} themeMode
 * @property {Object} handlers
 */

export const PANEL_CONTRACTS = Object.freeze({
  instrument: "InstrumentPanelContract",
  theory: "TheoryPanelContract",
  practice: "PracticePanelContract",
  export: "ExportPanelContract",
  customTuningModals: "CustomTuningModalsContract",
});
