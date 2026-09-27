import { useMemo, useCallback } from "react";
import {
  buildNoteAliases,
  germanToEnglishNoteName,
  renderNoteName,
} from "@domain/theory/notation";
import { nameToPc, pcToName } from "@domain/theory/tonalAdapter";

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
    pcToName(pc, system.divisions, primaryAccidental),
    noteNaming,
  );
  if (accidental !== "both") return primary;

  const alternate = renderNoteName(
    pcToName(pc, system.divisions, secondaryAccidental),
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
      const canonical = pcToName(pc, system.divisions, acc);
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
      const preferred = renderNoteName(
        pcToName(pc, system.divisions, acc),
        noteNaming,
      );
      map.set(preferred, pc);
    }
  }

  return map;
}

// Custom EDOs used to be named "N0".."N<n>"; saved tunings may still use it.
const LEGACY_PC_NAME = /^N(\d+)$/;

/**
 * Pitch class of a note name: the display names first (they settle the
 * German/English B ambiguity for the current naming), then any spelling the
 * theory engine parses ("Db↑", "^C", "C##", German "Desih"), then the legacy
 * "N<pc>" names. Unknown names are pitch class 0.
 */
export function resolvePcForName(nameToPcMap, name, divisions) {
  const known = nameToPcMap.get(name);
  if (typeof known === "number") return known;
  if (typeof name !== "string" || !name) return 0;

  const parsed =
    nameToPc(name, divisions) ??
    nameToPc(germanToEnglishNoteName(name), divisions);
  if (parsed !== null) return parsed;

  const legacy = LEGACY_PC_NAME.exec(name);
  const legacyPc = legacy ? Number(legacy[1]) : NaN;
  return legacyPc < divisions ? legacyPc : 0;
}

/**
 * Maps between note-name spellings and pitch classes for a given tuning system.
 * Exposes:
 *  - pcForName(name) → number
 *  - nameForPc(pc) → string (using current accidental preference)
 */
export function usePitchMapping(system, accidental, noteNaming = "english") {
  const nameToPcMap = useMemo(() => {
    return buildNameToPcMap(system, noteNaming, accidental);
  }, [system, noteNaming, accidental]);

  const pcForName = useCallback(
    (name) => resolvePcForName(nameToPcMap, name, system.divisions),
    [nameToPcMap, system.divisions],
  );

  const nameForPc = useCallback(
    (pc) => nameForPcWithDisplayAccidentals(system, pc, accidental, noteNaming),
    [system, accidental, noteNaming],
  );

  return useMemo(() => ({ pcForName, nameForPc }), [pcForName, nameForPc]);
}
