import { useMemo } from "react";
import { buildDisplayControlModel } from "@/app/adapters/controls";

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

  const theoryPanel = useMemo(
    () => ({
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
        defaultScale: theoryDomain.scale.defaultScale,
      },
      chord: theoryDomain.chord,
      randomize: {
        randomizeMode: practiceDomain.randomize.randomizeMode,
        setRandomizeMode: practiceDomain.randomize.setRandomizeMode,
        onRandomize: practiceDomain.practiceActions.randomizeScaleNow,
      },
      reset: { resetMusicalState },
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
      resetMusicalState,
    ],
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
