import { useMemo, useRef } from "react";

import { useDisplayState } from "@features/display";
import {
  downloadPNG,
  downloadSVG,
  printFretboard,
  useExportCustomTuningDomain,
} from "@features/export";
import { useInstrumentDomain } from "@features/instrument";
import { usePracticeMetronomeDomain } from "@features/practice";
import { useUrlShareHydration } from "@features/share";
import { useTheoryDomain } from "@features/theory";
import { PanelHeader } from "@shared/ui";
import { useConfirm } from "@shared/hooks/useConfirm";
import { TUNINGS } from "@domain/theory/tuning";
import { ALL_SCALES } from "@domain/theory/scales";
import { PRESET_TUNING_META } from "@domain/presets/presets";
import { DEFAULT_TUNINGS, PRESET_TUNINGS } from "@domain/presets/presetState";
import {
  DISPLAY_DEFAULTS,
  getFactoryFrets,
  METRONOME_DEFAULTS,
  ROOT_DEFAULT,
  SCALE_DEFAULT,
  SYSTEM_DEFAULT,
} from "@shared/config/appDefaults";

import AppLayout from "@app/shell/AppLayout";
import { AppModals, AppPanels } from "@app/shell/AppPanels";
import StageShell from "@app/shell/StageShell";
import ToastProvider from "@app/providers/ToastProvider";
import { useAppOrchestration } from "@app/hooks/useAppOrchestration";
import { useAppPanelModels } from "@app/hooks/useAppPanelModels";

export default function App() {
  const boardRef = useRef(null);
  const { confirm } = useConfirm();

  const {
    display: {
      prefs: displayPrefs,
      setPrefs: setDisplayPrefs,
      resetPrefs: resetDisplayPrefs,
      setters: displaySetters,
    },
    themeState,
    stage: stageState,
  } = useDisplayState(DISPLAY_DEFAULTS);
  const { value: theme, setTheme, mode: themeMode } = themeState;
  const { stageRef, isFs, toggleFs } = stageState;

  const theoryDomain = useTheoryDomain({
    tunings: TUNINGS,
    defaultSystemId: SYSTEM_DEFAULT,
    defaultRoot: ROOT_DEFAULT,
    accidental: displayPrefs.accidental,
    noteNaming: displayPrefs.noteNaming,
    allScales: ALL_SCALES,
    defaultScale: SCALE_DEFAULT,
  });

  const instrumentDomain = useInstrumentDomain({
    system: theoryDomain.system.system,
    sysNames: theoryDomain.system.sysNames,
    systemId: theoryDomain.system.systemId,
    setSystemId: theoryDomain.system.setSystemId,
    tunings: TUNINGS,
    factory: getFactoryFrets,
    presetMeta: PRESET_TUNING_META,
    defaultTunings: DEFAULT_TUNINGS,
    presetTunings: PRESET_TUNINGS,
    confirm,
    noteNaming: displayPrefs.noteNaming,
  });
  const { instrumentState, instrumentDerived, capo } = instrumentDomain;
  const { tuning, stringMeta, boardMeta } = instrumentState;
  const { drawFrets } = instrumentDerived;

  const practiceDomain = usePracticeMetronomeDomain({
    metronomeDefaults: METRONOME_DEFAULTS,
    randomizeConfig: {
      sysNames: theoryDomain.system.sysNames,
      scaleOptions: theoryDomain.scale.scaleOptions,
      setRoot: theoryDomain.system.setRoot,
      setScale: theoryDomain.scale.setScale,
      selectedRoot: theoryDomain.system.root,
      selectedScale: theoryDomain.scale.scale,
    },
  });

  useUrlShareHydration({
    theoryDomain,
    instrumentDomain,
  });

  const orchestration = useAppOrchestration({
    displayPrefs,
    setDisplayPrefs,
    resetDisplayPrefs,
    setTheme,
    toggleFs,
    theorySystem: theoryDomain.system,
    theoryScale: theoryDomain.scale,
    theoryChord: theoryDomain.chord,
    instrumentActions: instrumentDomain.instrumentActions,
    instrumentPresets: instrumentDomain.presets,
    instrumentCapo: instrumentDomain.capo,
    instrumentFrets: instrumentDomain.fretsSlice,
    customPackEditor: instrumentDomain.customPackEditor,
    practiceActions: practiceDomain.practiceActions,
    practiceMetronome: practiceDomain.metronome,
    practiceReset: practiceDomain.reset,
    confirm,
  });
  const { resetInstrumentFactory, resetDisplay, resetAll, resetMusicalState } =
    orchestration.resets;

  const {
    instrumentPanel,
    instrumentControlModel,
    theoryPanel,
    practicePanel,
    metronomeControlModel,
    displayControlModel,
    shareState,
  } = useAppPanelModels({
    theoryDomain,
    practiceDomain,
    instrumentDomain,
    resetInstrumentFactory,
    resetMusicalState,
    displayPrefs,
    displaySetters,
  });

  const exportCustomDomain = useExportCustomTuningDomain({
    boardRef,
    shareState,
    tunings: TUNINGS,
    themeMode,
    root: theoryDomain.system.root,
    scale: theoryDomain.scale.scale,
    accidental: displayPrefs.accidental,
    noteNaming: displayPrefs.noteNaming,
    strings: instrumentState.strings,
    systemId: theoryDomain.system.systemId,
    tuning,
    stringMeta,
    boardMeta,
    showChord: theoryDomain.chord.showChord,
    chordRoot:
      theoryPanel.controlModel.meta.transposedChordRoot ??
      theoryDomain.chord.chordRoot,
    chordType: theoryDomain.chord.chordType,
    customTunings: instrumentDomain.customTunings,
    customPackEditor: instrumentDomain.customPackEditor,
    exporters: { downloadPNG, downloadSVG, printFretboard },
  });

  const header = <PanelHeader theme={theme} setTheme={setTheme} />;
  const stage = useMemo(
    () => (
      <StageShell
        boardRef={boardRef}
        stageRef={stageRef}
        isFs={isFs}
        toggleFs={toggleFs}
        resetAll={resetAll}
        showPracticeHud={orchestration.showPracticeHud}
        displayPrefs={displayPrefs}
        theoryDomain={theoryDomain}
        theoryPanel={theoryPanel}
        instrumentState={instrumentState}
        drawFrets={drawFrets}
        boardMeta={boardMeta}
        capo={capo}
        onResetCapo={orchestration.onResetCapo}
      />
    ),
    [
      boardRef,
      stageRef,
      isFs,
      toggleFs,
      resetAll,
      orchestration.showPracticeHud,
      displayPrefs,
      theoryDomain,
      theoryPanel,
      instrumentState,
      drawFrets,
      boardMeta,
      capo,
      orchestration.onResetCapo,
    ],
  );

  const controls = useMemo(
    () => (
      <AppPanels
        instrumentPanel={instrumentPanel}
        instrumentControlModel={instrumentControlModel}
        theoryPanel={theoryPanel}
        practicePanel={practicePanel}
        metronomeControlModel={metronomeControlModel}
        displayPrefs={displayPrefs}
        resetDisplay={resetDisplay}
        displayControlModel={displayControlModel}
        exportPanel={exportCustomDomain.exportPanel}
      />
    ),
    [
      instrumentPanel,
      instrumentControlModel,
      theoryPanel,
      practicePanel,
      metronomeControlModel,
      displayPrefs,
      resetDisplay,
      displayControlModel,
      exportCustomDomain.exportPanel,
    ],
  );

  const modals = <AppModals modalPanel={exportCustomDomain.modalPanel} />;

  return (
    <AppLayout
      header={header}
      stage={stage}
      controls={controls}
      modals={modals}
      toaster={<ToastProvider />}
    />
  );
}
