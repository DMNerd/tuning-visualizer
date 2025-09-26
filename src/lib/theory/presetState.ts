import { TUNINGS } from "@/lib/theory/tuning";
import {
  systemsFromTuningMap,
  buildPresetStateForSystems,
} from "@/lib/theory/constants";

const SYSTEMS = systemsFromTuningMap(TUNINGS);
export const { PRESET_TUNINGS, DEFAULT_TUNINGS, DEFAULT_PRESET_NAME } =
  buildPresetStateForSystems(SYSTEMS);
