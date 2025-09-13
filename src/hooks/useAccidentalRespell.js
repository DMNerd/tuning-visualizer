import { useEffect } from "react";

/**
 * Keeps root, tuning, and chord root in sync when the accidental/system changes.
 */
export function useAccidentalRespell({
  system,
  accidental,
  pcFromName,
  setRoot,
  setTuning,
  setChordRoot,
}) {
  useEffect(() => {
    const toName = (pc) => system.nameForPc(pc, accidental);

    setRoot((prev) => {
      const next = toName(pcFromName(prev));
      return next !== prev ? next : prev;
    });

    setTuning((prev) => {
      const next = prev.map((n) => toName(pcFromName(n)));
      const same =
        prev.length === next.length && prev.every((v, i) => v === next[i]);
      return same ? prev : next;
    });

    setChordRoot((prev) => {
      const next = toName(pcFromName(prev));
      return next !== prev ? next : prev;
    });
  }, [accidental, system, pcFromName, setRoot, setTuning, setChordRoot]);
}
