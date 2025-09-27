import { useState, useCallback, useMemo } from "react";

export function useFretsTouched(initial = 22) {
  const [frets, setFrets] = useState(initial);
  const [fretsTouched, setFretsTouched] = useState(false);

  const setFretsUI = useCallback((val) => {
    setFrets(val);
    setFretsTouched(true);
  }, []);

  return useMemo(
    () => ({ frets, setFrets, fretsTouched, setFretsTouched, setFretsUI }),
    [frets, setFrets, fretsTouched, setFretsTouched, setFretsUI],
  );
}
