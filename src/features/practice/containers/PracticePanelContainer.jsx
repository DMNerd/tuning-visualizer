import React from "react";
import { ErrorBoundary } from "react-error-boundary";

import ErrorFallback from "@shared/ui/ErrorFallback";
import Section from "@shared/ui/Section";
import MetronomeControls from "@features/practice/components/MetronomeControls";
import { TrainingRoutinesControls } from "@features/training";

export default function PracticePanelContainer({
  metronome,
  controlModel,
  reset,
  routinePlayback,
  routineLiveDefaults,
}) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      resetKeys={[
        metronome.bpm,
        metronome.timeSig,
        metronome.subdivision,
        metronome.isPlaying,
      ]}
      onReset={reset.resetPracticeCounters}
    >
      <Section
        id="metronome-training-controls"
        title="Metronome and Training"
        size="sm"
      >
        <MetronomeControls
          state={controlModel.state}
          actions={controlModel.actions}
          meta={controlModel.meta}
        />
        <TrainingRoutinesControls
          routinePlayback={routinePlayback}
          liveDefaults={routineLiveDefaults}
        />
      </Section>
    </ErrorBoundary>
  );
}
