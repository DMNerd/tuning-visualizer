import { useCallback, useState } from "react";
import { useFretsTouched } from "@/hooks/useFretsTouched";
import { useInstrumentPrefs } from "@/hooks/useInstrumentPrefs";
import { useDefaultTuning } from "@/hooks/useDefaultTuning";
import { useStringsChange } from "@/hooks/useStringsChange";
import { useDrawFrets } from "@/hooks/useDrawFrets";
import { useCapo } from "@/hooks/useCapo";

export function useInstrumentConfig({
  system,
  systemId,
  stringsRange,
  fretsRange,
  factory,
  presetMeta,
  defaultTunings,
  presetTunings,
}) {
  const { frets, setFrets, fretsTouched, setFretsUI, setFretsTouched } =
    useFretsTouched(factory(system.divisions));

  const { strings, setStrings, resetInstrumentPrefs, setFretsPref } =
    useInstrumentPrefs({
      frets,
      fretsTouched,
      setFrets,
      setFretsUI,
      setFretsTouched,
      STR_MIN: stringsRange.min,
      STR_MAX: stringsRange.max,
      FRETS_MIN: fretsRange.min,
      FRETS_MAX: fretsRange.max,
      STR_FACTORY: factory,
    });

  const {
    tuning,
    setTuning,
    presetMap,
    presetMetaMap,
    saveDefault,
    savedExists,
    defaultForCount,
  } = useDefaultTuning({
    systemId,
    strings,
    DEFAULT_TUNINGS: defaultTunings,
    PRESET_TUNINGS: presetTunings,
    PRESET_TUNING_META: presetMeta,
  });

  const [stringMeta, setStringMeta] = useState(null);
  const [boardMeta, setBoardMeta] = useState(null);

  const handleSaveDefault = useCallback(() => {
    saveDefault(stringMeta, boardMeta);
  }, [boardMeta, saveDefault, stringMeta]);

  const handleStringsChange = useStringsChange({
    setStrings,
    setTuning,
    defaultForCount,
  });

  const drawFrets = useDrawFrets({
    baseFrets: frets,
    divisions: system.divisions,
    fretsTouched,
    setFretsRaw: setFrets,
  });

  const capo = useCapo({
    strings,
    stringMeta,
  });

  return {
    strings,
    setStrings,
    frets,
    setFrets,
    setFretsPref,
    setFretsUI,
    fretsTouched,
    resetInstrumentPrefs,
    tuning,
    setTuning,
    presetMap,
    presetMetaMap,
    savedExists,
    defaultForCount,
    stringMeta,
    setStringMeta,
    boardMeta,
    setBoardMeta,
    handleSaveDefault,
    handleStringsChange,
    drawFrets,
    capo,
  };
}
