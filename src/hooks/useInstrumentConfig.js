import { useCallback, useMemo, useState } from "react";
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

  const state = useMemo(
    () => ({ strings, frets, tuning, stringMeta, boardMeta }),
    [strings, frets, tuning, stringMeta, boardMeta],
  );
  const actions = useMemo(
    () => ({
      setStrings,
      setFrets,
      setFretsPref,
      setFretsUI,
      setTuning,
      setStringMeta,
      setBoardMeta,
      resetInstrumentPrefs,
      handleSaveDefault,
      handleStringsChange,
    }),
    [
      setStrings,
      setFrets,
      setFretsPref,
      setFretsUI,
      setTuning,
      setStringMeta,
      setBoardMeta,
      resetInstrumentPrefs,
      handleSaveDefault,
      handleStringsChange,
    ],
  );
  const derived = useMemo(
    () => ({ drawFrets, fretsTouched, savedExists, defaultForCount }),
    [drawFrets, fretsTouched, savedExists, defaultForCount],
  );
  const presets = useMemo(
    () => ({ presetMap, presetMetaMap }),
    [presetMap, presetMetaMap],
  );

  // Canonical API: consume `state`, `actions`, `derived`, `presets`, and `capo`.
  return {
    state,
    actions,
    derived,
    presets,
    capo,
  };
}

export function useInstrumentCapoSlice(instrumentConfig) {
  return instrumentConfig.capo;
}

export function useInstrumentFretsSlice(instrumentConfig) {
  const { state, actions, derived } = instrumentConfig;
  return useMemo(
    () => ({
      strings: state.strings,
      frets: state.frets,
      drawFrets: derived.drawFrets,
      setFretsUI: actions.setFretsUI,
      setFretsPref: actions.setFretsPref,
      handleStringsChange: actions.handleStringsChange,
    }),
    [
      state.strings,
      state.frets,
      derived.drawFrets,
      actions.setFretsUI,
      actions.setFretsPref,
      actions.handleStringsChange,
    ],
  );
}
