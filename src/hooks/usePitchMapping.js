import { useMemo, useCallback } from "react";

/**
 * Maps between note-name spellings and pitch classes for a given tuning system.
 * Exposes:
 *  - pcForName(name) → number
 *  - nameForPc(pc) → string (using current accidental preference)
 */
export function usePitchMapping(system, accidental) {
  const nameToPc = useMemo(() => {
    const map = new Map();
    for (let pc = 0; pc < system.divisions; pc++) {
      map.set(system.nameForPc(pc, "sharp"), pc);
      map.set(system.nameForPc(pc, "flat"), pc);
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
