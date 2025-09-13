import { useState, useCallback } from "react";

export function useFretsTouched(initial = 22) {
  const [frets, setFrets] = useState(initial);
  const [fretsTouched, setFretsTouched] = useState(false);

  const setFretsUI = useCallback((val) => {
    setFrets(val);
    setFretsTouched(true);
  }, []);

  return { frets, setFrets, fretsTouched, setFretsTouched, setFretsUI };
}
