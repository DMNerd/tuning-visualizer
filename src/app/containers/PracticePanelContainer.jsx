import React from "react";
import { ErrorBoundary } from "react-error-boundary";

import ErrorFallback from "@/components/UI/ErrorFallback";
import MetronomeControls from "@/components/UI/controls/MetronomeControls";

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
      <MetronomeControls {...controlModel} />
    </ErrorBoundary>
  );
}
