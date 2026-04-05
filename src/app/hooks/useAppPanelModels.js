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
          systemId: theoryDomain.system.systemId,
          system: theoryDomain.system.system,
          sysNames: theoryDomain.system.sysNames,
          nameForPc: theoryDomain.system.nameForPc,
          rootIx: theoryDomain.system.rootIx,
        },
        scale: {
          root: theoryDomain.system.root,
          setRoot: theoryDomain.system.setRoot,
          scale: theoryDomain.scale.scale,
          setScale: theoryDomain.scale.setScale,
          scaleOptions: theoryDomain.scale.scaleOptions,
          intervals: theoryDomain.scale.intervals,
        },
        chord: theoryDomain.chord,
        randomize: {
          randomizeMode: practiceDomain.randomize.randomizeMode,
          setRandomizeMode: practiceDomain.randomize.setRandomizeMode,
          onRandomize: practiceDomain.practiceActions.randomizeScaleNow,
        },
        defaults: {
          root: ROOT_DEFAULT,
          scale: theoryDomain.scale.defaultScale ?? SCALE_DEFAULT,
          chordRoot: ROOT_DEFAULT,
          chordType: CHORD_DEFAULT,
        },
      }),
    [
      theoryDomain.system.systemId,
      theoryDomain.system.system,
      theoryDomain.system.sysNames,
      theoryDomain.system.nameForPc,
      theoryDomain.system.rootIx,
      theoryDomain.system.root,
      theoryDomain.system.setRoot,
      theoryDomain.scale.scale,
      theoryDomain.scale.setScale,
      theoryDomain.scale.scaleOptions,
      theoryDomain.scale.intervals,
      theoryDomain.scale.defaultScale,
      theoryDomain.chord,
      practiceDomain.randomize.randomizeMode,
      practiceDomain.randomize.setRandomizeMode,
      practiceDomain.practiceActions.randomizeScaleNow,
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
        degreeCount: theoryDomain.scale.intervals.length,
      }),
    [displayPrefs, displaySetters, theoryDomain.scale.intervals.length],
  );

  return {
    instrumentPanel,
    instrumentControlModel,
    theoryPanel,
    practicePanel: practiceDomain.practicePanel,
    metronomeControlModel: practiceDomain.metronomeControlModel,
    displayControlModel,
  };
}
