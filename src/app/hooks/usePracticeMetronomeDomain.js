import { useMemo } from "react";
import { buildMetronomeControlModel } from "@/app/adapters/controls";
import { PANEL_CONTRACTS } from "@/app/contracts/panelContracts";
import usePracticePanelState from "@/app/containers/usePracticePanelState";
import { buildPracticeMetronomeDomainReturn } from "@/app/hooks/domainReturnBuilders";

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
  const { safeBarsPerScale, barsRemaining } = metronome;
  const { resetPracticeCounters } = reset;

  const practicePanel = useMemo(
    () => ({
      contract: PANEL_CONTRACTS.practice,
      metronome: {
        ...metronomePrefs,
        ...metronomeEngine,
        safeBarsPerScale,
        barsRemaining,
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

  return buildPracticeMetronomeDomainReturn({
    randomize,
    metronome,
    practiceActions,
    reset,
    practicePanel,
    metronomeControlModel,
  });
}
