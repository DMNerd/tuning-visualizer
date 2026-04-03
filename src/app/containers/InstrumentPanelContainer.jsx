import React from "react";
import { ErrorBoundary } from "react-error-boundary";

import ErrorFallback from "@/components/UI/ErrorFallback";
import InstrumentControls from "@/components/UI/controls/InstrumentControls";

export default function InstrumentPanelContainer({
  state,
  controlModel,
  reset,
}) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      resetKeys={[state.strings, state.frets, state.systemId]}
      onReset={() => {
        reset.resetInstrumentFactory(state.system.divisions);
      }}
    >
      <InstrumentControls {...controlModel} />
    </ErrorBoundary>
  );
}
