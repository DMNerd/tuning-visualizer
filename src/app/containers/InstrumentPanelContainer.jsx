import React from "react";
import { ErrorBoundary } from "react-error-boundary";

import ErrorFallback from "@/components/UI/ErrorFallback";
import InstrumentControls from "@/components/UI/controls/InstrumentControls";

export default function InstrumentPanelContainer({
  state,
  preset,
  handlers,
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
      <InstrumentControls
        strings={state.strings}
        setStrings={handlers.setStrings}
        frets={state.frets}
        setFrets={handlers.setFretsPref}
        systems={state.tunings}
        setSystemId={handlers.setSystemId}
        sysNames={state.sysNames}
        tuning={state.tuning}
        setTuning={handlers.setTuning}
        handleStringsChange={handlers.handleStringsChange}
        presetNames={preset.mergedPresetNames}
        customPresetNames={preset.customPresetNames}
        presetMetaMap={preset.mergedPresetMetaMap}
        selectedPreset={preset.selectedPreset}
        setSelectedPreset={preset.setPreset}
        handleSaveDefault={handlers.handleSaveDefault}
        handleResetFactoryDefault={reset.resetInstrumentFactory}
        systemId={state.systemId}
        onCreateCustomPack={handlers.openCreate}
        onEditCustomPack={handlers.openEditSelected}
      />
    </ErrorBoundary>
  );
}
