import { useMemo, useRef } from "react";
import clsx from "clsx";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiLoader,
} from "react-icons/fi";
import { Toaster, ToastBar } from "react-hot-toast";

import { downloadPNG, downloadSVG, printFretboard } from "@/lib/export/scales";
import Fretboard from "@/components/Fretboard/Fretboard";
import StageHudContainer from "@/app/containers/StageHudContainer";

import { TUNINGS } from "@/lib/theory/tuning";
import { ALL_SCALES } from "@/lib/theory/scales";
import { PRESET_TUNING_META } from "@/lib/presets/presets";

import {
  STR_MIN,
  STR_MAX,
  FRETS_MIN,
  FRETS_MAX,
  getFactoryFrets,
  SYSTEM_DEFAULT,
  ROOT_DEFAULT,
  DISPLAY_DEFAULTS,
  METRONOME_DEFAULTS,
  SCALE_DEFAULT,
} from "@/lib/config/appDefaults";

import { DEFAULT_TUNINGS, PRESET_TUNINGS } from "@/lib/presets/presetState";

import PanelHeader from "@/components/UI/PanelHeader";
import SafeSection from "@/components/UI/SafeSection";
import DisplayControls from "@/components/UI/controls/DisplayControls";

import { useConfirm } from "@/hooks/useConfirm";
import { useDisplayState } from "@/hooks/useDisplayState";
import AppLayout from "@/components/Layout/AppLayout";
import InstrumentPanelContainer from "@/app/containers/InstrumentPanelContainer";
import TheoryPanelContainer from "@/app/containers/TheoryPanelContainer";
import PracticePanelContainer from "@/app/containers/PracticePanelContainer";
import ExportPanelContainer from "@/app/containers/ExportPanelContainer";
import CustomTuningModalsContainer from "@/app/containers/CustomTuningModalsContainer";
import { useTheoryDomain } from "@/app/hooks/useTheoryDomain";
import { useInstrumentDomain } from "@/app/hooks/useInstrumentDomain";
import { usePracticeMetronomeDomain } from "@/app/hooks/usePracticeMetronomeDomain";
import { useExportCustomTuningDomain } from "@/app/hooks/useExportCustomTuningDomain";
import { useAppOrchestration } from "@/app/hooks/useAppOrchestration";
import { useAppPanelModels } from "@/app/hooks/useAppPanelModels";

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
    stringsRange: { min: STR_MIN, max: STR_MAX },
    fretsRange: { min: FRETS_MIN, max: FRETS_MAX },
    factory: getFactoryFrets,
    presetMeta: PRESET_TUNING_META,
    defaultTunings: DEFAULT_TUNINGS,
    presetTunings: PRESET_TUNINGS,
    confirm,
    noteNaming: displayPrefs.noteNaming,
  });
  const { instrumentState, instrumentDerived, capo } = instrumentDomain;
  const { strings, tuning, stringMeta, boardMeta } = instrumentState;
  const { drawFrets } = instrumentDerived;
  const { capoFret, toggleCapoAt, effectiveStringMeta } = capo;

  const {
    show,
    showOpen,
    showFretNums,
    dotSize,
    lefty,
    openOnlyInScale,
    colorByDegree,
    accidental,
    microLabelStyle,
  } = displayPrefs;

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

  const exportCustomDomain = useExportCustomTuningDomain({
    boardRef,
    tunings: TUNINGS,
    themeMode,
    root: theoryDomain.system.root,
    scale: theoryDomain.scale.scale,
    accidental,
    noteNaming: displayPrefs.noteNaming,
    strings: instrumentState.strings,
    systemId: theoryDomain.system.systemId,
    tuning,
    stringMeta,
    boardMeta,
    showChord: theoryDomain.chord.showChord,
    chordRoot: theoryDomain.chord.chordRoot,
    chordType: theoryDomain.chord.chordType,
    customTunings: instrumentDomain.customTunings,
    customPackEditor: instrumentDomain.customPackEditor,
    exporters: { downloadPNG, downloadSVG, printFretboard },
  });

  const header = <PanelHeader theme={theme} setTheme={setTheme} />;
  const showPracticeHud = orchestration.showPracticeHud;

  const stage = (
    <div className="tv-stage" ref={stageRef}>
      <div
        className={clsx("tv-stage__surface", { "is-lefty": lefty })}
        onDoubleClick={() => toggleFs()}
      >
        <StageHudContainer
          isFs={isFs}
          onToggleFs={toggleFs}
          onResetAll={() => resetAll({ confirm: true })}
          showPracticeHud={showPracticeHud}
        />
        <SafeSection onReset={orchestration.onResetCapo}>
          <Fretboard
            ref={boardRef}
            strings={strings}
            frets={drawFrets}
            tuning={tuning}
            rootIx={theoryDomain.system.rootIx}
            intervals={theoryDomain.scale.intervals}
            accidental={accidental}
            noteNaming={displayPrefs.noteNaming}
            microLabelStyle={microLabelStyle}
            show={show}
            showOpen={showOpen}
            showFretNums={showFretNums}
            dotSize={dotSize}
            lefty={lefty}
            system={theoryDomain.system.system}
            chordPCs={theoryDomain.chord.chordOverlayPcs}
            chordRootPc={theoryDomain.chord.chordRootIx}
            openOnlyInScale={openOnlyInScale}
            colorByDegree={colorByDegree}
            hideNonChord={theoryDomain.chord.hideNonChord}
            stringMeta={effectiveStringMeta}
            boardMeta={boardMeta}
            onSelectNote={theoryDomain.handlers.handleSelectNote}
            capoFret={capoFret}
            onSetCapo={toggleCapoAt}
          />
        </SafeSection>
      </div>
    </div>
  );

  const {
    instrumentPanel,
    instrumentControlModel,
    theoryPanel,
    practicePanel,
    metronomeControlModel,
    displayControlModel,
  } = useAppPanelModels({
    theoryDomain,
    practiceDomain,
    instrumentDomain,
    resetInstrumentFactory,
    resetMusicalState,
    displayPrefs,
    displaySetters,
  });

  const controls = useMemo(
    () => (
      <>
        <InstrumentPanelContainer
          {...instrumentPanel}
          controlModel={instrumentControlModel}
        />
        <TheoryPanelContainer {...theoryPanel} />
        <PracticePanelContainer
          {...practicePanel}
          controlModel={metronomeControlModel}
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
        <ExportPanelContainer {...exportCustomDomain.exportPanel} />
      </>
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

  const modals = (
    <CustomTuningModalsContainer {...exportCustomDomain.modalPanel} />
  );

  const toaster = (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 2800,
        className: "tv-toast",
      }}
      containerClassName="tv-toast-container"
    >
      {(t) => {
        const icon =
          t.type === "success" ? (
            <FiCheckCircle size={18} color="var(--accent)" />
          ) : t.type === "error" ? (
            <FiAlertTriangle size={18} color="var(--root)" />
          ) : t.type === "loading" ? (
            <FiLoader size={18} className="tv-u-spin" />
          ) : (
            <FiInfo size={18} color="var(--fg)" />
          );
        return (
          <ToastBar toast={t}>
            {({ message, action }) => (
              <div className="tv-toast-bar">
                <span className="tv-toast-icon">{icon}</span>
                <div>{message}</div>
                {action}
              </div>
            )}
          </ToastBar>
        );
      }}
    </Toaster>
  );

  return (
    <AppLayout
      header={header}
      stage={stage}
      controls={controls}
      modals={modals}
      toaster={toaster}
    />
  );
}
