import React from "react";
import { ErrorBoundary } from "react-error-boundary";

import ErrorFallback from "@shared/ui/ErrorFallback";
import MetronomeControls from "@features/practice/components/MetronomeControls";

export default function PracticePanelContainer({
  metronome,
  controlModel,
  reset,
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
      <MetronomeControls
        state={controlModel.state}
        actions={controlModel.actions}
        meta={controlModel.meta}
      />
    </ErrorBoundary>
  );
}
