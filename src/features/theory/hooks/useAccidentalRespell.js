import { useEffect, useRef } from "react";
import { useSystemNoteNames } from "./useSystemNoteNames";

export function normalizeNameForSystem(pc, nameForPc, sysNames) {
  const candidate = nameForPc(pc);
  if (sysNames.includes(candidate)) return candidate;
  if (sysNames.length > 0) {
    const idx = ((pc % sysNames.length) + sysNames.length) % sysNames.length;
    return sysNames[idx] ?? candidate;
  }
  return candidate;
}

export function useAccidentalRespell({
  system,
  accidental,
  noteNaming,
  setRoot,
  setTuning,
  setChordRoot,
}) {
  const prevPcFromNameRef = useRef(null);
  const prevSystemRef = useRef(system);
  const { pcFromName, nameForPc, sysNames } = useSystemNoteNames(
    system,
    accidental,
    noteNaming,
  );

  useEffect(() => {
    // The tuning system itself changing (not just the accidental/naming
    // preference) means pcFromName's pitch-class space changed too (e.g.
    // 12-TET's 0-11 vs 24-TET's 0-23) — reparsing root/tuning/chordRoot
    // with the *previous* system's mapping would misinterpret a name that
    // the caller already made valid under the new system before this runs.
    // Treat a system change like the very first run: reparse with the
    // current (new-system) mapping, which is a no-op respell, instead of
    // the stale one left over from the old system.
    const systemChanged = prevSystemRef.current !== system;
    prevSystemRef.current = system;

    const parsePrevName = systemChanged
      ? pcFromName
      : (prevPcFromNameRef.current ?? pcFromName);
    const normalizeName = (pc) =>
      normalizeNameForSystem(pc, nameForPc, sysNames);

    setRoot((prev) => {
      const next = normalizeName(parsePrevName(prev));
      return next !== prev ? next : prev;
    });

    setTuning((prev) => {
      if (!Array.isArray(prev)) return prev;
      const next = prev.map((n) => normalizeName(parsePrevName(n)));
      const same =
        prev.length === next.length && prev.every((v, i) => v === next[i]);
      return same ? prev : next;
    });

    setChordRoot((prev) => {
      const next = normalizeName(parsePrevName(prev));
      return next !== prev ? next : prev;
    });

    prevPcFromNameRef.current = pcFromName;
  }, [
    system,
    accidental,
    noteNaming,
    pcFromName,
    nameForPc,
    sysNames,
    setRoot,
    setTuning,
    setChordRoot,
  ]);
}
