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
  const { pcFromName, nameForPc, sysNames } = useSystemNoteNames(
    system,
    accidental,
    noteNaming,
  );

  useEffect(() => {
    const parsePrevName = prevPcFromNameRef.current ?? pcFromName;
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
