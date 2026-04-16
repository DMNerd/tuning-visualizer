import { useMemo, useCallback } from "react";
import { buildNoteAliases, renderNoteName } from "@/lib/theory/notation";

function getDisplayAccidentals(accidental) {
  if (accidental === "both") return ["sharp", "flat"];
  return accidental === "flat" ? ["flat", "sharp"] : ["sharp", "flat"];
}

export function nameForPcWithDisplayAccidentals(
  system,
  pc,
  accidental = "sharp",
  noteNaming = "english",
) {
  const [primaryAccidental, secondaryAccidental] =
    getDisplayAccidentals(accidental);
  const primary = renderNoteName(
    system.nameForPc(pc, primaryAccidental),
    noteNaming,
  );
  if (accidental !== "both") return primary;

  const alternate = renderNoteName(
    system.nameForPc(pc, secondaryAccidental),
    noteNaming,
  );
  return primary === alternate ? primary : `${primary}/${alternate}`;
}

export function buildNameToPcMap(
  system,
  noteNaming = "english",
  accidental = "sharp",
) {
  const map = new Map();
  for (let pc = 0; pc < system.divisions; pc++) {
    for (const acc of ["sharp", "flat"]) {
      const canonical = system.nameForPc(pc, acc);
      for (const alias of buildNoteAliases(canonical)) {
        map.set(alias, pc);
      }
    }
  }

  // Resolve ambiguous aliases (notably DE/CZ B/H) according to current naming mode.
  // We apply both accidental spellings so parsing remains stable if persisted values
  // were saved under a different accidental preference.
  for (let pc = 0; pc < system.divisions; pc++) {
    for (const acc of getDisplayAccidentals(accidental)) {
      const preferred = renderNoteName(system.nameForPc(pc, acc), noteNaming);
      map.set(preferred, pc);
    }
  }

  return map;
}

/**
 * Maps between note-name spellings and pitch classes for a given tuning system.
 * Exposes:
 *  - pcForName(name) → number
 *  - nameForPc(pc) → string (using current accidental preference)
 */
export function usePitchMapping(system, accidental, noteNaming = "english") {
  const nameToPc = useMemo(() => {
    return buildNameToPcMap(system, noteNaming, accidental);
  }, [system, noteNaming, accidental]);

  const pcForName = useCallback(
    (name) => {
      const pc = nameToPc.get(name);
      return typeof pc === "number" ? pc : 0;
    },
    [nameToPc],
  );

  const nameForPc = useCallback(
    (pc) => nameForPcWithDisplayAccidentals(system, pc, accidental, noteNaming),
    [system, accidental, noteNaming],
  );

  return useMemo(() => ({ pcForName, nameForPc }), [pcForName, nameForPc]);
}
