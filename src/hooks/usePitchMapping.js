import { useMemo, useCallback } from "react";
import { buildNoteAliases, renderNoteName } from "@/lib/theory/noteNaming";

/**
 * Maps between note-name spellings and pitch classes for a given tuning system.
 * Exposes:
 *  - pcForName(name) → number
 *  - nameForPc(pc) → string (using current accidental preference)
 */
export function usePitchMapping(system, accidental, noteNaming = "english") {
  const nameToPc = useMemo(() => {
    const map = new Map();
    for (let pc = 0; pc < system.divisions; pc++) {
      for (const acc of ["sharp", "flat"]) {
        const canonical = system.nameForPc(pc, acc);
        for (const alias of buildNoteAliases(canonical)) {
          map.set(alias, pc);
        }
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
    (pc) => renderNoteName(system.nameForPc(pc, accidental), noteNaming),
    [system, accidental, noteNaming],
  );

  return useMemo(() => ({ pcForName, nameForPc }), [pcForName, nameForPc]);
}
