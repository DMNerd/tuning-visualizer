import { TUNINGS } from "@domain/theory/tuning";
import {
  systemsFromTuningMap,
  buildPresetStateForSystems,
} from "@domain/presets/presets";

const SYSTEMS = systemsFromTuningMap(TUNINGS);
export const { PRESET_TUNINGS, DEFAULT_TUNINGS, DEFAULT_PRESET_NAME } =
  buildPresetStateForSystems(SYSTEMS);
