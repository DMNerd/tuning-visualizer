import { useMemo } from "react";
import {
  buildDisplayControlModel,
  buildTheoryControlModel,
} from "@/app/adapters/controls";
import {
  CHORD_DEFAULT,
  ROOT_DEFAULT,
  SCALE_DEFAULT,
} from "@/lib/config/appDefaults";

export function useAppPanelModels({
  theoryDomain,
  practiceDomain,
  instrumentDomain,
  resetInstrumentFactory,
  resetMusicalState,
  displayPrefs,
  displaySetters,
}) {
  const { buildInstrumentPanel, buildInstrumentControlModelWithReset } =
    instrumentDomain;
  const {
    system: theorySystem,
    scale: theoryScale,
    chord: theoryChord,
  } = theoryDomain;
  const { randomize, practiceActions, practicePanel, metronomeControlModel } =
    practiceDomain;

  const { systemId, system, sysNames, nameForPc, rootIx, root, setRoot } =
    theorySystem;
  const { scale, setScale, scaleOptions, intervals, defaultScale } =
    theoryScale;
  const {
    chordRoot,
    setChordRoot,
    chordType,
    setChordType,
    showChord,
    setShowChord,
    hideNonChord,
    setHideNonChord,
    chordRootIx,
    chordOverlayPcs,
    chordTonePcs,
  } = theoryChord;
  const { randomizeMode, setRandomizeMode } = randomize;
  const { randomizeScaleNow } = practiceActions;

  const instrumentPanel = useMemo(
    () => buildInstrumentPanel(resetInstrumentFactory),
    [buildInstrumentPanel, resetInstrumentFactory],
  );

  const instrumentControlModel = useMemo(
    () => buildInstrumentControlModelWithReset(resetInstrumentFactory),
    [buildInstrumentControlModelWithReset, resetInstrumentFactory],
  );

  const theoryControlModel = useMemo(
    () =>
      buildTheoryControlModel({
        system: {
          systemId,
          system,
          sysNames,
          nameForPc,
          rootIx,
        },
        scale: {
          root,
          setRoot,
          scale,
          setScale,
          scaleOptions,
          intervals,
        },
        chord: {
          chordRoot,
          setChordRoot,
          chordType,
          setChordType,
          showChord,
          setShowChord,
          hideNonChord,
          setHideNonChord,
          chordRootIx,
          chordOverlayPcs,
          chordTonePcs,
        },
        randomize: {
          randomizeMode,
          setRandomizeMode,
          onRandomize: randomizeScaleNow,
        },
        defaults: {
          root: ROOT_DEFAULT,
          scale: defaultScale ?? SCALE_DEFAULT,
          chordRoot: ROOT_DEFAULT,
          chordType: CHORD_DEFAULT,
        },
      }),
    [
      systemId,
      system,
      sysNames,
      nameForPc,
      rootIx,
      root,
      setRoot,
      scale,
      setScale,
      scaleOptions,
      intervals,
      defaultScale,
      chordRoot,
      setChordRoot,
      chordType,
      setChordType,
      showChord,
      setShowChord,
      hideNonChord,
      setHideNonChord,
      chordRootIx,
      chordOverlayPcs,
      chordTonePcs,
      randomizeMode,
      setRandomizeMode,
      randomizeScaleNow,
    ],
  );

  const theoryPanel = useMemo(
    () => ({
      controlModel: theoryControlModel,
      reset: { resetMusicalState },
    }),
    [theoryControlModel, resetMusicalState],
  );

  const displayControlModel = useMemo(
    () =>
      buildDisplayControlModel({
        displayPrefs,
        displaySetters,
        degreeCount: intervals.length,
      }),
    [displayPrefs, displaySetters, intervals.length],
  );

  return {
    instrumentPanel,
    instrumentControlModel,
    theoryPanel,
    practicePanel,
    metronomeControlModel,
    displayControlModel,
  };
}
