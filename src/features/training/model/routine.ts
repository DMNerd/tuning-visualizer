import { TUNINGS } from "@domain/theory/tuning";
import { nameForPcWithDisplayAccidentals } from "@features/fretboard";
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

/** Note name for a pitch class within a tuning system, respecting the app's
 * accidental/note-naming display prefs (German/Czech, flats, etc.) the same
 * way every other note label in the app does — with a safe fallback for a
 * system that doesn't (or no longer) exists in `TUNINGS`. */
export function nameForRootPc(
  systemId: string,
  rootPc: number,
  accidental: string = "sharp",
  noteNaming: string = "english",
): string {
  const system = TUNINGS[systemId];
  return system
    ? nameForPcWithDisplayAccidentals(system, rootPc, accidental, noteNaming)
    : `N${rootPc}`;
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

/** Builds a fresh routine draft. `strings`/`presetName` default to the
 * factory tuning but should normally be seeded with the app's *live*
 * instrument state (see useRoutineDraft) so a new draft starts from what's
 * actually loaded rather than always the factory 6-string default. */
export function createEmptyRoutine(
  systemId: string = SYSTEM_DEFAULT,
  strings: number = STR_FACTORY,
  presetName?: string,
): Routine {
  const now = Date.now();
  return {
    id: generateRoutineId(),
    name: "",
    createdAt: now,
    updatedAt: now,
    startBlock: {
      systemId,
      strings,
      presetName: presetName ?? resolveDefaultPresetName(systemId, strings),
      beats: ROUTINE_BEATS_DEFAULT,
    },
    steps: [],
  };
}
