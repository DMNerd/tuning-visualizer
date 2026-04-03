import React from "react";
import { ErrorBoundary } from "react-error-boundary";

import ErrorFallback from "@/components/UI/ErrorFallback";
import MetronomeControls from "@/components/UI/controls/MetronomeControls";

export default function PracticePanelContainer({
  metronome,
  controls,
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
        isPlaying={metronome.isPlaying}
        bpm={metronome.bpm}
        setBpm={controls.setBpm}
        timeSig={metronome.timeSig}
        setTimeSig={controls.setTimeSig}
        subdivision={metronome.subdivision}
        setSubdivision={controls.setSubdivision}
        countInEnabled={metronome.countInEnabled}
        setCountInEnabled={controls.setCountInEnabled}
        autoAdvanceEnabled={metronome.autoAdvanceEnabled}
        setAutoAdvanceEnabled={controls.setAutoAdvanceEnabled}
        barsPerScale={metronome.safeBarsPerScale}
        setBarsPerScale={controls.setBarsPerScale}
        announceCountInBeforeChange={metronome.announceCountInBeforeChange}
        setAnnounceCountInBeforeChange={controls.setAnnounceCountInBeforeChange}
        barsRemaining={metronome.barsRemaining}
        toggleMetronome={controls.toggleMetronome}
        bpmUp={controls.bpmUp}
        bpmDown={controls.bpmDown}
        tapTempo={controls.tapTempo}
        randomizeScaleNow={controls.randomizeScaleNow}
      />
    </ErrorBoundary>
  );
}
