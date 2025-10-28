import { useState, useCallback, useMemo } from "react";
import { useToggle } from "react-use";
import { FRETS_FACTORY } from "@/lib/config/appDefaults";

export function useFretsTouched(initial = FRETS_FACTORY) {
  const [frets, setFrets] = useState(initial);
  const [fretsTouched, setFretsTouched] = useToggle(false);

  const setFretsUI = useCallback(
    (val) => {
      setFrets(val);
      setFretsTouched(true);
    },
    [setFrets, setFretsTouched],
  );

  return useMemo(
    () => ({ frets, setFrets, fretsTouched, setFretsTouched, setFretsUI }),
    [frets, setFrets, fretsTouched, setFretsTouched, setFretsUI],
  );
}
