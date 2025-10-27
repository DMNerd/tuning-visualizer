import { useEffect } from "react";
import { useSystemNoteNames } from "./useSystemNoteNames";

export function useAccidentalRespell({
  system,
  accidental,
  setRoot,
  setTuning,
  setChordRoot,
}) {
  const { pcFromName, nameForPc, sysNames } = useSystemNoteNames(
    system,
    accidental,
  );

  useEffect(() => {
    const normalizeName = (pc) => {
      const candidate = nameForPc(pc);
      if (sysNames.includes(candidate)) return candidate;
      if (sysNames.length > 0) {
        const idx =
          ((pc % sysNames.length) + sysNames.length) % sysNames.length;
        return sysNames[idx] ?? candidate;
      }
      return candidate;
    };

    setRoot((prev) => {
      const next = normalizeName(pcFromName(prev));
      return next !== prev ? next : prev;
    });

    setTuning((prev) => {
      if (!Array.isArray(prev)) return prev;
      const next = prev.map((n) => normalizeName(pcFromName(n)));
      const same =
        prev.length === next.length && prev.every((v, i) => v === next[i]);
      return same ? prev : next;
    });

    setChordRoot((prev) => {
      const next = normalizeName(pcFromName(prev));
      return next !== prev ? next : prev;
    });
  }, [
    accidental,
    pcFromName,
    nameForPc,
    sysNames,
    setRoot,
    setTuning,
    setChordRoot,
  ]);
}
