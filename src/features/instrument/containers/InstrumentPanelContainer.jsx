import React from "react";
import { ErrorBoundary } from "react-error-boundary";

import ErrorFallback from "@shared/ui/ErrorFallback";
import InstrumentControls from "@features/instrument/components/InstrumentControls";

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
        reset.resetInstrumentFactory(state.systemDivisions);
      }}
    >
      <InstrumentControls
        state={controlModel.state}
        actions={controlModel.actions}
        meta={controlModel.meta}
      />
    </ErrorBoundary>
  );
}
