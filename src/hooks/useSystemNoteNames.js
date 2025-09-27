import { useMemo } from "react";
import { usePitchMapping } from "@/hooks/usePitchMapping";

/**
 * Provides pc<->name mapping & the system's full name list.
 */
export function useSystemNoteNames(system, accidental) {
  const { pcForName: pcFromName, nameForPc } = usePitchMapping(
    system,
    accidental,
  );

  const sysNames = useMemo(
    () => Array.from({ length: system.divisions }, (_, pc) => nameForPc(pc)),
    [system, nameForPc],
  );

  return useMemo(
    () => ({ pcFromName, nameForPc, sysNames }),
    [pcFromName, nameForPc, sysNames],
  );
}
