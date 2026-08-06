import { useMemo } from "react";
import { buildMetronomeControlModel } from "@features/practice/model/controlModel";
import { PANEL_CONTRACTS } from "@shared/lib/panelContracts";
import usePracticePanelState from "@features/practice/containers/usePracticePanelState";
import { buildPracticeMetronomeDomainReturn } from "@shared/lib/domainReturnBuilders";

export function usePracticeMetronomeDomain({
  metronomeDefaults,
  randomizeConfig,
}) {
  const practice = usePracticePanelState({
    metronomeDefaults,
    randomizeConfig,
  });

  const { metronome, randomize, reset } = practice;
  const practiceActions = practice.practiceActions;
  const metronomePrefs = metronome.prefs;
  const metronomeEngine = metronome.engine;
  const metronomeSetters = metronome.setters;
  const { safeBarsPerScale, barsRemaining, isRoutinePlaying } = metronome;
  const { resetPracticeCounters } = reset;

  const practicePanel = useMemo(
    () => ({
      contract: PANEL_CONTRACTS.practice,
      metronome: {
        ...metronomePrefs,
        ...metronomeEngine,
        safeBarsPerScale,
        barsRemaining,
        isRoutinePlaying,
      },
      controls: {
        ...metronomeSetters,
        ...practiceActions,
      },
      reset: { resetPracticeCounters },
    }),
    [
      metronomePrefs,
      metronomeEngine,
      safeBarsPerScale,
      barsRemaining,
      isRoutinePlaying,
      metronomeSetters,
      practiceActions,
      resetPracticeCounters,
    ],
  );

  const metronomeControlModel = useMemo(
    () =>
      buildMetronomeControlModel({
        metronome: practicePanel.metronome,
        controls: practicePanel.controls,
      }),
    [practicePanel.metronome, practicePanel.controls],
  );

  // Memoize construction, not passthrough references.

  const practiceDomain = useMemo(
    () =>
      buildPracticeMetronomeDomainReturn({
        randomize,
        metronome,
        practiceActions,
        reset,
        practicePanel,
        metronomeControlModel,
      }),
    [
      randomize,
      metronome,
      practiceActions,
      reset,
      practicePanel,
      metronomeControlModel,
    ],
  );

  return practiceDomain;
}
