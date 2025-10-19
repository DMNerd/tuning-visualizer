import { useMemo, useCallback } from "react";
import { TUNINGS } from "@/lib/theory/tuning";

/**
 * Maps between note-name spellings and pitch classes for a given tuning system.
 * Exposes:
 *  - pcForName(name) → number
 *  - nameForPc(pc) → string (using current accidental preference)
 */
export function usePitchMapping(system, accidental) {
  const nameToPc = useMemo(() => {
    const map = new Map();
    const { divisions } = system;

    for (let pc = 0; pc < divisions; pc++) {
      map.set(system.nameForPc(pc, "sharp"), pc);
      map.set(system.nameForPc(pc, "flat"), pc);
    }

    const twelveTet = TUNINGS?.["12-TET"];
    if (twelveTet && Number.isFinite(divisions) && divisions > 0) {
      const scaleFactor = divisions / 12;
      for (let pc12 = 0; pc12 < 12; pc12++) {
        const approxPc = Math.round(pc12 * scaleFactor) % divisions;
        const sharpName = twelveTet.nameForPc(pc12, "sharp");
        if (!map.has(sharpName)) map.set(sharpName, approxPc);

        const flatName = twelveTet.nameForPc(pc12, "flat");
        if (!map.has(flatName)) map.set(flatName, approxPc);
      }
    }

    return map;
  }, [system]);

  const pcForName = useCallback(
    (name) => {
      const pc = nameToPc.get(name);
      return typeof pc === "number" ? pc : 0;
    },
    [nameToPc],
  );

  const nameForPc = useCallback(
    (pc) => system.nameForPc(pc, accidental),
    [system, accidental],
  );

  return useMemo(() => ({ pcForName, nameForPc }), [pcForName, nameForPc]);
}
