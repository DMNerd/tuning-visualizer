import { useEffect, useMemo, useState } from "react";
import { useToggle } from "react-use";
import { ROOT_DEFAULT, CHORD_DEFAULT } from "@/lib/config/appDefaults";
import {
  buildChordPCsFromPc,
  isMicrotonalChordType,
} from "@/lib/theory/chords";

export function useChordLogic(system, pcFromName) {
  const [chordRoot, setChordRoot] = useState(ROOT_DEFAULT);
  const [chordType, setChordType] = useState(CHORD_DEFAULT);
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
    setChordType(CHORD_DEFAULT);
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
