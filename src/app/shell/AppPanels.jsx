import { InstrumentPanelContainer } from "@features/instrument";
import { TheoryPanelContainer } from "@features/theory";
import { PracticePanelContainer } from "@features/practice";
import { DisplayControls } from "@features/display";
import {
  CustomTuningModalsContainer,
  ExportPanelContainer,
} from "@features/export";
import { SafeSection } from "@shared/ui";

export function AppPanels({
  instrumentPanel,
  instrumentControlModel,
  theoryPanel,
  practicePanel,
  metronomeControlModel,
  displayPrefs,
  resetDisplay,
  displayControlModel,
  exportPanel,
  routinePlayback,
  routineLiveDefaults,
}) {
  return (
    <>
      <InstrumentPanelContainer
        {...instrumentPanel}
        controlModel={instrumentControlModel}
      />
      <TheoryPanelContainer {...theoryPanel} />
      <PracticePanelContainer
        {...practicePanel}
        controlModel={metronomeControlModel}
        routinePlayback={routinePlayback}
        routineLiveDefaults={routineLiveDefaults}
      />
      <SafeSection
        resetKeys={[displayPrefs]}
        onReset={() => {
          resetDisplay();
        }}
      >
        <DisplayControls
          state={displayControlModel.state}
          actions={displayControlModel.actions}
          meta={displayControlModel.meta}
        />
      </SafeSection>
      <ExportPanelContainer {...exportPanel} />
    </>
  );
}

export function AppModals({ modalPanel }) {
  return <CustomTuningModalsContainer {...modalPanel} />;
}
