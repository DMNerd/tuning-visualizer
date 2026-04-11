import { useCallback, useEffect, useMemo, useRef } from "react";
import { useKey } from "react-use";
import {
  FRETS_MAX,
  FRETS_MIN,
  STR_MAX,
  STR_MIN,
  DOT_SIZE_MAX,
  DOT_SIZE_MIN,
} from "@/lib/config/appDefaults";
import { createShortcutHandler } from "@/hooks/hotkeyHandler";
import { buildShortcutTableFromRefs } from "@/hooks/hotkeysTable";

/** @typedef {import("@/hooks/hotkeys.types").HotkeysLiveState} HotkeysLiveState */
/** @typedef {import("@/hooks/hotkeys.types").HotkeysLiveRef} HotkeysLiveRef */

export function useHotkeys(options) {
  const {
    toggleFs,
    setDisplayPrefs,
    setFrets,
    handleStringsChange,
    setShowChord,
    setHideNonChord,
    strings,
    frets,
    onShowCheatsheet,
    minStrings = STR_MIN,
    maxStrings = STR_MAX,
    minFrets = FRETS_MIN,
    maxFrets = FRETS_MAX,
    minDot = DOT_SIZE_MIN,
    maxDot = DOT_SIZE_MAX,
    onRandomizeScale,
    onCreateCustomPack,
    practiceActions,
    enabled = true,
  } = options;

  const labelValues = useMemo(
    () => options.labelValues || options.LABEL_VALUES || [],
    [options.labelValues, options.LABEL_VALUES],
  );

  /** @type {HotkeysLiveState} */
  const initialLive = {
    toggleFs,
    setDisplayPrefs,
    setFrets,
    handleStringsChange,
    setShowChord,
    setHideNonChord,
    strings,
    frets,
    onShowCheatsheet,
    minStrings,
    maxStrings,
    minFrets,
    maxFrets,
    minDot,
    maxDot,
    labelValues,
    onRandomizeScale,
    onCreateCustomPack,
    practiceActions,
    enabled,
  };

  /** @type {HotkeysLiveRef} */
  const liveRef = useRef(initialLive);

  useEffect(() => {
    liveRef.current = {
      toggleFs,
      setDisplayPrefs,
      setFrets,
      handleStringsChange,
      setShowChord,
      setHideNonChord,
      strings,
      frets,
      onShowCheatsheet,
      minStrings,
      maxStrings,
      minFrets,
      maxFrets,
      minDot,
      maxDot,
      labelValues,
      onRandomizeScale,
      onCreateCustomPack,
      practiceActions,
      enabled,
    };
  }, [
    enabled,
    frets,
    handleStringsChange,
    labelValues,
    maxDot,
    maxFrets,
    maxStrings,
    minDot,
    minFrets,
    minStrings,
    onCreateCustomPack,
    onRandomizeScale,
    onShowCheatsheet,
    practiceActions,
    setDisplayPrefs,
    setFrets,
    setHideNonChord,
    setShowChord,
    strings,
    toggleFs,
  ]);

  const shortcuts = useMemo(() => buildShortcutTableFromRefs(liveRef), []);
  const shortcutHandler = useMemo(
    () => createShortcutHandler(shortcuts, { enabled: true }),
    [shortcuts],
  );
  const onKey = useCallback(
    (event) => {
      if (!liveRef.current.enabled) return;
      shortcutHandler(event);
    },
    [shortcutHandler],
  );

  useKey(true, onKey, undefined, []);
}
