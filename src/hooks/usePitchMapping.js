import { useMemo } from "react";

/**
 * Maps between note-name spellings and pitch classes for a given tuning system.
 * Exposes:
 *  - pcForName(name) → number
 *  - nameForPc(pc) → string (using current accidental preference)
 */
export function usePitchMapping(system, accidental) {
  // Build a spelling → pitch-class map that accepts BOTH sharps and flats
  const nameToPc = useMemo(() => {
    const map = new Map();
    for (let pc = 0; pc < system.divisions; pc++) {
      map.set(system.nameForPc(pc, "sharp"), pc);
      map.set(system.nameForPc(pc, "flat"), pc);
    }
    return map;
  }, [system]);

  const pcForName = (name) => {
    const pc = nameToPc.get(name);
    return typeof pc === "number" ? pc : 0;
  };

  const nameForPc = (pc) => system.nameForPc(pc, accidental);

  return { pcForName, nameForPc };
}
