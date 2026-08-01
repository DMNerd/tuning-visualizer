import { TUNINGS } from "@domain/theory/tuning";
import {
  ALL_SCALES,
  buildBaselineScalesForSystem,
  type ScaleDef,
} from "@domain/theory/scales";
import {
  PRESET_TUNINGS,
  DEFAULT_PRESET_NAME,
} from "@domain/presets/presetState";
import { STR_FACTORY, SYSTEM_DEFAULT } from "@shared/config/appDefaults";
import { generateId } from "@shared/lib/generateId";
import {
  ROUTINE_BEATS_DEFAULT,
  ROUTINE_BPM_DEFAULT,
} from "@features/training/model/routineLimits";
import { ROUTINE_TIME_SIGNATURE_DEFAULT } from "@features/training/model/routineTimeSignatures";

export type RoutineStartBlock = {
  systemId: string;
  strings: number;
  presetName: string;
  beats: number;
};

export type RoutineScaleBlock = {
  id: string;
  scaleLabel: string;
  rootPc: number;
  beats: number;
  bpm: number;
  timeSig: string;
};

export type Routine = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  startBlock: RoutineStartBlock;
  steps: RoutineScaleBlock[];
};

/** Curated catalog first, falling back to the generic baseline builder for
 * any tuning system without hand-authored scales. */
export function resolveScaleOptionsForSystem(
  systemId: string,
  divisions: number,
): ScaleDef[] {
  const curated = ALL_SCALES.filter((scale) => scale.systemId === systemId);
  if (curated.length > 0) return curated;
  return buildBaselineScalesForSystem(systemId, divisions);
}

/** Note name for a pitch class within a tuning system, with a safe fallback
 * for a system that doesn't (or no longer) exists in `TUNINGS`. */
export function nameForRootPc(systemId: string, rootPc: number): string {
  const system = TUNINGS[systemId];
  return system ? system.nameForPc(rootPc) : `N${rootPc}`;
}

/** Preset names available for a specific tuning system + string count. */
export function resolvePresetNamesForSystem(
  systemId: string,
  strings: number,
): string[] {
  const group =
    (PRESET_TUNINGS as Record<string, Record<string, Record<string, unknown>>>)[
      systemId
    ]?.[strings] ?? {};
  return Object.keys(group).sort((a, b) => a.localeCompare(b));
}

export function generateRoutineId(): string {
  return generateId("routine");
}

export function createEmptyScaleBlock(): RoutineScaleBlock {
  return {
    id: generateRoutineId(),
    scaleLabel: "",
    rootPc: 0,
    beats: ROUTINE_BEATS_DEFAULT,
    bpm: ROUTINE_BPM_DEFAULT,
    timeSig: ROUTINE_TIME_SIGNATURE_DEFAULT,
  };
}

function resolveDefaultPresetName(systemId: string, strings: number): string {
  const bySystem =
    (DEFAULT_PRESET_NAME as Record<string, Record<string, string>>)[systemId] ??
    {};
  return bySystem[strings] ?? Object.values(bySystem)[0] ?? "";
}

export function createEmptyRoutine(systemId: string = SYSTEM_DEFAULT): Routine {
  const now = Date.now();
  const strings = STR_FACTORY;
  return {
    id: generateRoutineId(),
    name: "",
    createdAt: now,
    updatedAt: now,
    startBlock: {
      systemId,
      strings,
      presetName: resolveDefaultPresetName(systemId, strings),
      beats: ROUTINE_BEATS_DEFAULT,
    },
    steps: [],
  };
}
