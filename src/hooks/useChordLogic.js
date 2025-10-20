import { useEffect, useMemo, useState } from "react";
import {
  buildChordPCsFromPc,
  MICROTONAL_CHORD_TYPES,
} from "@/lib/theory/chords";

const MICROTONAL_TYPE_SET = new Set(MICROTONAL_CHORD_TYPES);

export function useChordLogic(system, pcFromName) {
  const [chordRoot, setChordRoot] = useState("C");
  const [chordType, setChordType] = useState("maj");
  const [showChord, setShowChord] = useState(false);
  const [hideNonChord, setHideNonChord] = useState(false);

  const chordRootIx = useMemo(
    () => pcFromName(chordRoot),
    [chordRoot, pcFromName],
  );

  const chordPCs = useMemo(
    () =>
      showChord
        ? buildChordPCsFromPc(chordRootIx, chordType, system.divisions)
        : null,
    [showChord, chordRootIx, chordType, system.divisions],
  );

  useEffect(() => {
    if (system.divisions === 24) return;
    if (!MICROTONAL_TYPE_SET.has(chordType)) return;
    setChordType("maj");
  }, [system.divisions, chordType, setChordType]);

  return useMemo(
    () => ({
      chordRoot,
      setChordRoot,
      chordType,
      setChordType,
      showChord,
      setShowChord,
      hideNonChord,
      setHideNonChord,
      chordRootIx,
      chordPCs,
    }),
    [chordRoot, chordType, showChord, hideNonChord, chordRootIx, chordPCs],
  );
}
