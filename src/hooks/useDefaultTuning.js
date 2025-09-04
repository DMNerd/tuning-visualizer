import { useEffect, useMemo, useState } from "react";

/**
 * Handles:
 * - resolving defaults (user-saved → per-system → 12-TET → safe fallback)
 * - tuning state (per systemId + string count)
 * - preset maps & names (per systemId + string count)
 * - save/load/reset default (localStorage)
 */
export function useDefaultTuning({ systemId, strings, DEFAULT_TUNINGS, PRESET_TUNINGS }) {
  const lsKey = useMemo(() => `fb.defaultTuning.${systemId}.${strings}`, [systemId, strings]);

  const getDefault = (sysId, count) => {
    // 1) user-saved default (for sys+count)
    try {
      const raw = localStorage.getItem(`fb.defaultTuning.${sysId}.${count}`);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch {}

    // 2) built-in per-system default
    const sysDefaults = DEFAULT_TUNINGS?.[sysId] || {};
    if (sysDefaults[count]) return sysDefaults[count];

    // 3) built-in 12-TET fallback
    const twelve = DEFAULT_TUNINGS?.["12-TET"] || {};
    if (twelve[count]) return twelve[count];

    // 4) ultra-safe fallback
    return ["E", "B", "G", "D", "A", "E"];
  };

  const [tuning, setTuning] = useState(() => getDefault(systemId, strings));

  // Presets (always include a “Factory default” option).
  const presetMap = useMemo(() => {
    const bySys = PRESET_TUNINGS?.[systemId];
    const byCount = bySys?.[strings];
    const factory = getDefault(systemId, strings);
    return byCount && Object.keys(byCount).length
      ? { "Factory default": factory, ...byCount }
      : { "Factory default": factory };
  }, [systemId, strings]);

  const presetNames = useMemo(() => Object.keys(presetMap), [presetMap]);

  // Storage helpers
  const saveDefault = () => {
    try { localStorage.setItem(lsKey, JSON.stringify(tuning)); } catch {}
  };
  const loadSavedDefault = () => {
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setTuning(arr);
      }
    } catch {}
  };
  const resetFactoryDefault = () => {
    try { localStorage.removeItem(lsKey); } catch {}
    setTuning(getDefault(systemId, strings));
  };
  const savedExists = useMemo(() => {
    try { return localStorage.getItem(lsKey) !== null; } catch { return false; }
  }, [lsKey]);

  // When temperament changes, adopt default (user → built-in).
  useEffect(() => {
    setTuning(getDefault(systemId, strings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemId]);

  // Expose a helper to get the default for a different string count (used by handleStringsChange).
  const defaultForCount = (count) => getDefault(systemId, count);

  return {
    tuning, setTuning,
    presetMap, presetNames,
    saveDefault, loadSavedDefault, resetFactoryDefault, savedExists,
    defaultForCount,
  };
}
