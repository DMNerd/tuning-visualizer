// src/types/theory.ts

export type SystemId = "12-TET" | "24-TET"; // extend as you add more

export type Accidental = "sharp" | "flat";

export interface TuningSystem {
  id: SystemId;
  divisions: number;
  nameForPc: (pc: number, accidental?: Accidental) => string;
}

export interface ScaleDef {
  label: string;
  systemId: SystemId;
  pcs: number[];
}

// DEFAULT_TUNINGS: per system → by string count → array of note names
export type DefaultTunings = Record<SystemId, Record<number, string[]>>;

// PRESET_TUNINGS: per system → by string count → named presets
export type PresetTunings = Record<
  SystemId,
  Record<number, Record<string, string[]>>
>;
