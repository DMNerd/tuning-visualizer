import {
  ROOT_DEFAULT,
  SCALE_DEFAULT,
  CHORD_DEFAULT,
} from "@shared/config/appDefaults";

export function resetMusicalStateFromRefs(current) {
  // Dependency note: stop/reset metronome before changing musical state
  // so no in-flight ticks can read stale root/scale/chord values.
  current.stopMetronome?.();
  current.resetMetronomePrefs?.();
  current.resetPracticeCounters?.();

  if (typeof current.resetTheory === "function") {
    current.resetTheory();
  } else {
    current.setRoot(ROOT_DEFAULT);
    current.setScale(SCALE_DEFAULT);
    current.setChordRoot(ROOT_DEFAULT);
    current.setChordType(CHORD_DEFAULT);
    current.setShowChord(false);
    current.setHideNonChord(false);
    current.setChordCapoRelative?.(false);
  }
  current.setPreset?.("Factory default");
  current.setTheme?.("auto");
}
