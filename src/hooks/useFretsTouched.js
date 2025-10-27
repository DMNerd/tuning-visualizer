import { useState, useCallback, useMemo } from "react";
import { useToggle } from "react-use";

export function useFretsTouched(initial = 22) {
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
