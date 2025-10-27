import { useEffect, useMemo, useState } from "react";
import { useToggle } from "react-use";
import {
  buildChordPCsFromPc,
  isMicrotonalChordType,
} from "@/lib/theory/chords";

export function useChordLogic(system, pcFromName) {
  const [chordRoot, setChordRoot] = useState("C");
  const [chordType, setChordType] = useState("maj");
  const [showChord, toggleShowChord] = useToggle(false);
  const [hideNonChord, toggleHideNonChord] = useToggle(false);

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
    if (!isMicrotonalChordType(chordType)) return;
    setChordType("maj");
  }, [system.divisions, chordType, setChordType]);

  return useMemo(
    () => ({
      chordRoot,
      setChordRoot,
      chordType,
      setChordType,
      showChord,
      setShowChord: toggleShowChord,
      hideNonChord,
      setHideNonChord: toggleHideNonChord,
      chordRootIx,
      chordPCs,
    }),
    [
      chordRoot,
      chordType,
      showChord,
      hideNonChord,
      chordRootIx,
      chordPCs,
      toggleShowChord,
      toggleHideNonChord,
    ],
  );
}
