import React, { useCallback } from "react";
import clsx from "clsx";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiLoader,
} from "react-icons/fi";
import { Toaster, ToastBar, toast } from "react-hot-toast";

import { downloadPNG, downloadSVG, printFretboard } from "@/lib/export/scales";
import Fretboard from "@/components/Fretboard/Fretboard";
import HotkeysCheatsheet from "@/components/UI/HotkeysCheatsheet";
import StageHud from "@/components/UI/StageHud";

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
  CAPO_DEFAULT,
  DISPLAY_DEFAULTS,
  METRONOME_DEFAULTS,
  SCALE_DEFAULT,
} from "@/lib/config/appDefaults";

import { DEFAULT_TUNINGS, PRESET_TUNINGS } from "@/lib/presets/presetState";

import PanelHeader from "@/components/UI/PanelHeader";
import SafeSection from "@/components/UI/SafeSection";
import DisplayControls from "@/components/UI/controls/DisplayControls";

import { useTuningIO } from "@/hooks/useTuningIO";
import { useMergedPresets } from "@/hooks/useMergedPresets";
import { useAccidentalRespell } from "@/hooks/useAccidentalRespell";
import { useChordLogic } from "@/hooks/useChordLogic";
import { useFileBase } from "@/hooks/useFileBase";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useResets } from "@/hooks/useResets";
import { useConfirm } from "@/hooks/useConfirm";
import { LABEL_VALUES } from "@/hooks/useLabels";
import { useCustomTuningPacks } from "@/hooks/useCustomTuningPacks";
import { useDisplayState } from "@/hooks/useDisplayState";
import { useSystemState } from "@/hooks/useSystemState";
import { useInstrumentConfig } from "@/hooks/useInstrumentConfig";
import { useScaleOptions } from "@/hooks/useScaleOptions";
import AppLayout from "@/components/Layout/AppLayout";
import InstrumentPanelContainer from "@/app/containers/InstrumentPanelContainer";
import TheoryPanelContainer from "@/app/containers/TheoryPanelContainer";
import PracticePanelContainer from "@/app/containers/PracticePanelContainer";
import usePracticePanelState from "@/app/containers/usePracticePanelState";
import ExportPanelContainer from "@/app/containers/ExportPanelContainer";
import CustomTuningModalsContainer from "@/app/containers/CustomTuningModalsContainer";
import { PANEL_CONTRACTS } from "@/app/contracts/panelContracts";

export default function App() {
  const boardRef = React.useRef(null);
  const { confirm } = useConfirm();

  const {
    displayPrefs,
    setDisplayPrefs,
    displaySetters,
    theme,
    setTheme,
    themeMode,
    stageRef,
    isFs,
    toggleFs,
  } = useDisplayState(DISPLAY_DEFAULTS);

  const {
    systemId,
    setSystemId,
    system,
    root,
    setRoot,
    pcFromName,
    nameForPc,
    sysNames,
    rootIx,
  } = useSystemState({
    tunings: TUNINGS,
    defaultSystemId: SYSTEM_DEFAULT,
    defaultRoot: ROOT_DEFAULT,
    accidental: displayPrefs.accidental,
  });

  const instrument = useInstrumentConfig({
    system,
    systemId,
    stringsRange: { min: STR_MIN, max: STR_MAX },
    fretsRange: { min: FRETS_MIN, max: FRETS_MAX },
    factory: getFactoryFrets,
    presetMeta: PRESET_TUNING_META,
    defaultTunings: DEFAULT_TUNINGS,
    presetTunings: PRESET_TUNINGS,
  });

  const {
    strings,
    setStrings,
    frets,
    setFretsPref,
    setFretsUI,
    resetInstrumentPrefs,
    tuning,
    setTuning,
    presetMap,
    presetMetaMap,
    savedExists,
    stringMeta,
    setStringMeta,
    boardMeta,
    setBoardMeta,
    handleSaveDefault,
    handleStringsChange,
    drawFrets,
    capo,
  } = instrument;

  const { capoFret, setCapoFret, toggleCapoAt, effectiveStringMeta } = capo;

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

  const {
    setShow,
    setShowOpen,
    setShowFretNums,
    setDotSize,
    setAccidental,
    setMicroLabelStyle,
    setOpenOnlyInScale,
    setColorByDegree,
    setLefty,
  } = displaySetters;

  const chord = useChordLogic(system, pcFromName);

  const { scale, setScale, scaleOptions, intervals } = useScaleOptions({
    system,
    ALL_SCALES,
    initial: SCALE_DEFAULT,
  });

  const practice = usePracticePanelState({
    metronomeDefaults: METRONOME_DEFAULTS,
    randomizeConfig: {
      sysNames,
      scaleOptions,
      setRoot,
      setScale,
    },
  });
  const practiceActions = practice.practiceActions;

  const fileBase = useFileBase({
    root,
    scale,
    accidental,
    strings: instrument.strings,
  });

  useAccidentalRespell({
    system,
    accidental,
    setRoot,
    setTuning: instrument.setTuning,
    setChordRoot: chord.setChordRoot,
  });

  const {
    customTunings,
    importFromJson,
    exportCurrent,
    exportAll,
    getCurrentTuningPack,
    saveCustomTuning,
    deleteCustomTuning,
    clearCustomTunings,
  } = useTuningIO({ systemId, strings: instrument.strings, TUNINGS });

  const {
    mergedPresetNames,
    customPresetNames,
    mergedPresetMetaMap,
    selectedPreset,
    setPreset,
    queuePresetByName,
  } = useMergedPresets({
    presetMap,
    presetMetaMap,
    customTunings,
    setTuning,
    setStringMeta,
    setBoardMeta,
    currentEdo: system.divisions,
    currentStrings: strings,
    systemId,
    strings,
    savedExists,
  });

  const showCheatsheet = useCallback(() => {
    toast((t) => <HotkeysCheatsheet onClose={() => toast.dismiss(t.id)} />, {
      id: "hotkeys-help",
      duration: 6000,
    });
  }, []);

  const {
    editorState,
    isManagerOpen,
    openCreate,
    openEditSelected,
    openManager,
    closeManager,
    editFromManager,
    deletePack,
    clearAllPacks,
    submitEditor,
    cancelEditor,
  } = useCustomTuningPacks({
    confirm,
    getCurrentTuningPack,
    saveCustomTuning,
    deleteCustomTuning,
    clearCustomTunings,
    tuning,
    stringMeta,
    boardMeta,
    customTunings,
    customPresetNames,
    selectedPreset,
    queuePresetByName,
  });

  useHotkeys({
    toggleFs,
    setDisplayPrefs,
    setFrets: setFretsUI,
    handleStringsChange,
    setShowChord: chord.setShowChord,
    setHideNonChord: chord.setHideNonChord,
    onShowCheatsheet: showCheatsheet,
    onRandomizeScale: practiceActions.randomizeScaleNow,
    onCreateCustomPack: openCreate,
    practiceActions,
    strings,
    frets,
    LABEL_VALUES,
    minStrings: STR_MIN,
    maxStrings: STR_MAX,
    minFrets: FRETS_MIN,
    maxFrets: FRETS_MAX,
  });

  const { resetInstrumentFactory, resetDisplay, resetAll, resetMusicalState } =
    useResets({
      system,
      resetInstrumentPrefs,
      setCapoFret,
      setStringMeta,
      setBoardMeta,
      setDisplayPrefs,
      setSystemId,
      setRoot,
      setScale,
      setChordRoot: chord.setChordRoot,
      setChordType: chord.setChordType,
      setShowChord: chord.setShowChord,
      setHideNonChord: chord.setHideNonChord,
      setPreset,
      stopMetronome: practice.metronomeEngine.stop,
      resetMetronomePrefs: practice.resetMetronomePrefs,
      resetPracticeCounters: practice.resetPracticeCounters,
      toast,
      confirm,
    });

  const handleSelectNote = useCallback(
    (pc, providedName, event) => {
      const noteName = providedName ?? nameForPc(pc);
      if (!noteName) return;
      if (!sysNames.includes(noteName)) return;

      if (event?.type === "contextmenu" || event?.button === 2) {
        event?.preventDefault?.();
        if (typeof chord.setChordRoot === "function") {
          chord.setChordRoot(noteName);
        }
        return;
      }

      setRoot(noteName);
    },
    [nameForPc, sysNames, chord, setRoot],
  );

  const buildHeader = useCallback(
    () => ({
      system: systemId,
      tuning,
      scale,
      chordEnabled: chord.showChord,
      chordRoot: chord.chordRoot,
      chordType: chord.chordType,
    }),
    [systemId, tuning, scale, chord.showChord, chord.chordRoot, chord.chordType],
  );

  const header = <PanelHeader theme={theme} setTheme={setTheme} />;
  const showPracticeHud = practice.metronomeEngine.isPlaying;

  const stage = (
    <div className="tv-stage" ref={stageRef}>
      <div
        className={clsx("tv-stage__surface", { "is-lefty": lefty })}
        onDoubleClick={() => toggleFs()}
      >
        <StageHud
          isFs={isFs}
          onToggleFs={() => toggleFs()}
          onResetAll={() => resetAll({ confirm: true })}
          currentBeat={practice.metronomeEngine.currentBeat}
          currentBar={practice.metronomeEngine.currentBar}
          timeSig={practice.metronomePrefs.timeSig}
          isPlaying={practice.metronomeEngine.isPlaying}
          showPracticeHud={showPracticeHud}
          countInEnabled={practice.metronomePrefs.countInEnabled}
          audioReady={practice.metronomeEngine.audioReady}
          audioError={practice.metronomeEngine.audioError}
        />
        <SafeSection
          onReset={() => {
            setCapoFret(CAPO_DEFAULT);
          }}
        >
          <Fretboard
            ref={boardRef}
            strings={strings}
            frets={drawFrets}
            tuning={tuning}
            rootIx={rootIx}
            intervals={intervals}
            accidental={accidental}
            microLabelStyle={microLabelStyle}
            show={show}
            showOpen={showOpen}
            showFretNums={showFretNums}
            dotSize={dotSize}
            lefty={lefty}
            system={system}
            chordPCs={chord.chordPCs}
            chordRootPc={chord.chordRootIx}
            openOnlyInScale={openOnlyInScale}
            colorByDegree={colorByDegree}
            hideNonChord={chord.hideNonChord}
            stringMeta={effectiveStringMeta}
            boardMeta={boardMeta}
            onSelectNote={handleSelectNote}
            capoFret={capoFret}
            onSetCapo={toggleCapoAt}
          />
        </SafeSection>
      </div>
    </div>
  );

  const instrumentPanel = {
    contract: PANEL_CONTRACTS.instrument,
    state: { strings, frets, tuning, systemId, sysNames, tunings: TUNINGS, system },
    preset: {
      mergedPresetNames,
      customPresetNames,
      mergedPresetMetaMap,
      selectedPreset,
      setPreset,
    },
    handlers: {
      setStrings,
      setFretsPref,
      setSystemId,
      setTuning,
      handleStringsChange,
      handleSaveDefault,
      openCreate,
      openEditSelected,
    },
    reset: { resetInstrumentFactory },
  };

  const theoryPanel = {
    contract: PANEL_CONTRACTS.theory,
    system: { systemId, system, sysNames, nameForPc, rootIx },
    scale: {
      root,
      setRoot,
      scale,
      setScale,
      scaleOptions,
      intervals,
      defaultScale: SCALE_DEFAULT,
    },
    chord,
    randomize: {
      randomizeMode: practice.randomizeMode,
      setRandomizeMode: practice.setRandomizeMode,
      onRandomize: practiceActions.randomizeScaleNow,
    },
    reset: { resetMusicalState },
  };

  const practicePanel = {
    contract: PANEL_CONTRACTS.practice,
    metronome: {
      ...practice.metronomePrefs,
      ...practice.metronomeEngine,
      safeBarsPerScale: practice.safeBarsPerScale,
      barsRemaining: practice.barsRemaining,
    },
    controls: {
      ...practice.metronomeSetters,
      ...practiceActions,
    },
    reset: { resetPracticeCounters: practice.resetPracticeCounters },
  };

  const exportPanel = {
    contract: PANEL_CONTRACTS.export,
    fileBase,
    boardRef,
    exporters: {
      downloadPNG,
      downloadSVG,
      printFretboard,
      buildHeader,
      exportCurrent: () => exportCurrent(tuning, stringMeta, boardMeta),
      exportAll,
      importFromJson,
    },
    packActions: {
      clearAllPacks,
      openManager,
    },
  };

  const modalPanel = {
    contract: PANEL_CONTRACTS.customTuningModals,
    modal: { editorState, isManagerOpen },
    customTunings,
    systems: TUNINGS,
    themeMode,
    handlers: {
      cancelEditor,
      submitEditor,
      closeManager,
      editFromManager,
      deletePack,
    },
  };

  const controls = (
    <>
      <InstrumentPanelContainer {...instrumentPanel} />
      <TheoryPanelContainer {...theoryPanel} />
      <PracticePanelContainer {...practicePanel} />
      <SafeSection
        resetKeys={[displayPrefs]}
        onReset={() => {
          resetDisplay();
        }}
      >
        <DisplayControls
          show={show}
          setShow={setShow}
          showOpen={showOpen}
          setShowOpen={setShowOpen}
          showFretNums={showFretNums}
          setShowFretNums={setShowFretNums}
          dotSize={dotSize}
          setDotSize={setDotSize}
          accidental={accidental}
          setAccidental={setAccidental}
          microLabelStyle={microLabelStyle}
          setMicroLabelStyle={setMicroLabelStyle}
          openOnlyInScale={openOnlyInScale}
          setOpenOnlyInScale={setOpenOnlyInScale}
          colorByDegree={colorByDegree}
          setColorByDegree={setColorByDegree}
          lefty={lefty}
          setLefty={setLefty}
          degreeCount={intervals.length}
        />
      </SafeSection>
      <ExportPanelContainer {...exportPanel} />
    </>
  );

  const modals = <CustomTuningModalsContainer {...modalPanel} />;

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
