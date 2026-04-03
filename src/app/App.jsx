import React, { useCallback } from "react";
import clsx from "clsx";
import { ErrorBoundary } from "react-error-boundary";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiLoader,
} from "react-icons/fi";
import { Toaster, ToastBar, toast } from "react-hot-toast";

// exporters
import { downloadPNG, downloadSVG, printFretboard } from "@/lib/export/scales";

// fretboard
import Fretboard from "@/components/Fretboard/Fretboard";

// cheatsheet
import HotkeysCheatsheet from "@/components/UI/HotkeysCheatsheet";
import StageHud from "@/components/UI/StageHud";

// theory
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

// existing UI atoms
import PanelHeader from "@/components/UI/PanelHeader";
import ScaleControls from "@/components/UI/controls/ScaleControls";
import MetronomeControls from "@/components/UI/controls/MetronomeControls";
import DisplayControls from "@/components/UI/controls/DisplayControls";
import InstrumentControls from "@/components/UI/controls/InstrumentControls";
import ExportControls from "@/components/UI/controls/ExportControls";
import ChordBuilder from "@/components/UI/ChordBuilder";
import ErrorFallback from "@/components/UI/ErrorFallback";
const TuningPackEditorModal = React.lazy(
  () => import("@/components/UI/modals/TuningPackEditorModal"),
);
const TuningPackManagerModal = React.lazy(
  () => import("@/components/UI/modals/TuningPackManagerModal"),
);

// hooks
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
import { useRandomScale } from "@/hooks/useRandomScale";
import { RANDOMIZE_MODES } from "@/hooks/useRandomScale";
import { usePracticeActions } from "@/hooks/usePracticeActions";
import { useDisplayState } from "@/hooks/useDisplayState";
import { useMetronomePrefs } from "@/hooks/useMetronomePrefs";
import { useMetronomeEngine } from "@/hooks/useMetronomeEngine";
import { useSystemState } from "@/hooks/useSystemState";
import { useInstrumentConfig } from "@/hooks/useInstrumentConfig";
import { useScaleOptions } from "@/hooks/useScaleOptions";
import AppLayout from "@/components/Layout/AppLayout";

export default function App() {
  const boardRef = React.useRef(null);
  const { confirm } = useConfirm();
  const randomizeScaleRef = React.useRef(() => {});
  const [randomizeMode, setRandomizeMode] = React.useState(
    RANDOMIZE_MODES.Both,
  );
  const [metronomePrefs, setMetronomePrefs, metronomeSetters] =
    useMetronomePrefs(METRONOME_DEFAULTS);
  const {
    bpm,
    timeSig,
    subdivision,
    countInEnabled,
    autoAdvanceEnabled,
    barsPerScale,
    announceCountInBeforeChange,
  } = metronomePrefs;
  const {
    setBpm,
    setTimeSig,
    setSubdivision,
    setCountInEnabled,
    setAutoAdvanceEnabled,
    setBarsPerScale,
    setAnnounceCountInBeforeChange,
  } = metronomeSetters;
  const safeBarsPerScale = Math.max(1, Number(barsPerScale) || 1);
  const [barsRemaining, setBarsRemaining] = React.useState(safeBarsPerScale);
  const barsRemainingRef = React.useRef(safeBarsPerScale);

  const handleMetronomeBeat = useCallback(
    ({ beat }) => {
      if (beat !== 1 || !autoAdvanceEnabled) return;

      const nextBarsRemaining = Math.max(0, barsRemainingRef.current - 1);
      if (announceCountInBeforeChange && nextBarsRemaining === 1) {
        toast("Scale change on next downbeat", { id: "scale-change-countin" });
      }

      if (nextBarsRemaining <= 0) {
        randomizeScaleRef.current?.();
        barsRemainingRef.current = safeBarsPerScale;
        setBarsRemaining(safeBarsPerScale);
        return;
      }

      barsRemainingRef.current = nextBarsRemaining;
      setBarsRemaining(nextBarsRemaining);
    },
    [announceCountInBeforeChange, autoAdvanceEnabled, safeBarsPerScale],
  );

  React.useEffect(() => {
    barsRemainingRef.current = safeBarsPerScale;
    setBarsRemaining(safeBarsPerScale);
  }, [safeBarsPerScale, autoAdvanceEnabled]);

  const {
    start,
    stop,
    isPlaying,
    currentBeat,
    currentBar,
    audioReady,
    audioError,
  } = useMetronomeEngine({
    bpm,
    timeSig,
    subdivision,
    onBeat: handleMetronomeBeat,
  });
  const resetMetronomePrefs = useCallback(() => {
    setMetronomePrefs(METRONOME_DEFAULTS);
  }, [setMetronomePrefs]);
  const resetPracticeCountersBase = useCallback(() => {
    barsRemainingRef.current = METRONOME_DEFAULTS.barsPerScale;
    setBarsRemaining(METRONOME_DEFAULTS.barsPerScale);
  }, []);

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
  const showPracticeHud = isPlaying;

  const {
    chordRoot,
    setChordRoot,
    chordType,
    setChordType,
    showChord,
    setShowChord,
    hideNonChord,
    setHideNonChord,
    chordRootIx,
    chordPCs,
  } = useChordLogic(system, pcFromName);

  const { scale, setScale, scaleOptions, intervals } = useScaleOptions({
    system,
    ALL_SCALES,
    initial: SCALE_DEFAULT,
  });

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
    setChordRoot,
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

  const { randomize: randomizeScale } = useRandomScale({
    sysNames,
    scaleOptions,
    setRoot,
    setScale,
    mode: randomizeMode,
    throttleMs: 150,
  });

  React.useEffect(() => {
    randomizeScaleRef.current = randomizeScale;
  }, [randomizeScale]);

  const practiceActions = usePracticeActions({
    isPlaying,
    startMetronome: start,
    stopMetronome: stop,
    setBpm,
    randomizeScale,
  });

  const resetPracticeCounters = useCallback(() => {
    resetPracticeCountersBase();
    practiceActions.resetTapTempo();
  }, [practiceActions, resetPracticeCountersBase]);

  const handleSelectNote = useCallback(
    (pc, providedName, event) => {
      const noteName = providedName ?? nameForPc(pc);
      if (!noteName) return;
      if (!sysNames.includes(noteName)) return;

      if (event?.type === "contextmenu" || event?.button === 2) {
        event?.preventDefault?.();
        if (typeof setChordRoot === "function") {
          setChordRoot(noteName);
        }
        return;
      }

      setRoot(noteName);
    },
    [nameForPc, sysNames, setChordRoot, setRoot],
  );

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
    setShowChord,
    setHideNonChord,
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
      setChordRoot,
      setChordType,
      setShowChord,
      setHideNonChord,
      setPreset,
      stopMetronome: stop,
      resetMetronomePrefs,
      resetPracticeCounters,
      toast,
      confirm,
    });

  const buildHeader = useCallback(
    () => ({
      system: systemId,
      tuning,
      scale,
      chordEnabled: showChord,
      chordRoot,
      chordType,
    }),
    [systemId, tuning, scale, showChord, chordRoot, chordType],
  );

  const header = <PanelHeader theme={theme} setTheme={setTheme} />;

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
          currentBeat={currentBeat}
          currentBar={currentBar}
          timeSig={timeSig}
          isPlaying={isPlaying}
          showPracticeHud={showPracticeHud}
          countInEnabled={countInEnabled}
          audioReady={audioReady}
          audioError={audioError}
        />
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
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
            chordPCs={chordPCs}
            chordRootPc={chordRootIx}
            openOnlyInScale={openOnlyInScale}
            colorByDegree={colorByDegree}
            hideNonChord={hideNonChord}
            stringMeta={effectiveStringMeta}
            boardMeta={boardMeta}
            onSelectNote={handleSelectNote}
            capoFret={capoFret}
            onSetCapo={toggleCapoAt}
          />
        </ErrorBoundary>
      </div>
    </div>
  );

  const controls = (
    <>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        resetKeys={[strings, frets, systemId]}
        onReset={() => {
          resetInstrumentFactory(system.divisions);
        }}
      >
        <InstrumentControls
          strings={strings}
          setStrings={setStrings}
          frets={frets}
          setFrets={setFretsPref}
          systems={TUNINGS}
          setSystemId={setSystemId}
          sysNames={sysNames}
          tuning={tuning}
          setTuning={setTuning}
          handleStringsChange={handleStringsChange}
          presetNames={mergedPresetNames}
          customPresetNames={customPresetNames}
          presetMetaMap={mergedPresetMetaMap}
          selectedPreset={selectedPreset}
          setSelectedPreset={setPreset}
          handleSaveDefault={handleSaveDefault}
          handleResetFactoryDefault={resetInstrumentFactory}
          systemId={systemId}
          onCreateCustomPack={openCreate}
          onEditCustomPack={openEditSelected}
        />
      </ErrorBoundary>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        resetKeys={[systemId, root, scale]}
        onReset={resetMusicalState}
      >
        <ScaleControls
          root={root}
          setRoot={setRoot}
          scale={scale}
          setScale={setScale}
          sysNames={sysNames}
          scaleOptions={scaleOptions}
          defaultScale={SCALE_DEFAULT}
          randomizeMode={randomizeMode}
          setRandomizeMode={setRandomizeMode}
          onRandomize={practiceActions.randomizeScaleNow}
        />
      </ErrorBoundary>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        resetKeys={[chordRoot, chordType, showChord, hideNonChord]}
        onReset={resetMusicalState}
      >
        <ChordBuilder
          root={chordRoot}
          onRootChange={setChordRoot}
          sysNames={sysNames}
          nameForPc={nameForPc}
          type={chordType}
          onTypeChange={setChordType}
          showChord={showChord}
          setShowChord={setShowChord}
          hideNonChord={hideNonChord}
          setHideNonChord={setHideNonChord}
          supportsMicrotonal={Number(system?.divisions) > 12}
          system={system}
          rootIx={rootIx}
          intervals={intervals}
          chordPCs={chordPCs}
          chordRootPc={chordRootIx}
        />
      </ErrorBoundary>
      <MetronomeControls
        isPlaying={isPlaying}
        bpm={bpm}
        setBpm={setBpm}
        timeSig={timeSig}
        setTimeSig={setTimeSig}
        subdivision={subdivision}
        setSubdivision={setSubdivision}
        countInEnabled={countInEnabled}
        setCountInEnabled={setCountInEnabled}
        autoAdvanceEnabled={autoAdvanceEnabled}
        setAutoAdvanceEnabled={setAutoAdvanceEnabled}
        barsPerScale={safeBarsPerScale}
        setBarsPerScale={setBarsPerScale}
        announceCountInBeforeChange={announceCountInBeforeChange}
        setAnnounceCountInBeforeChange={setAnnounceCountInBeforeChange}
        barsRemaining={barsRemaining}
        toggleMetronome={practiceActions.toggleMetronome}
        bpmUp={practiceActions.bpmUp}
        bpmDown={practiceActions.bpmDown}
        tapTempo={practiceActions.tapTempo}
        randomizeScaleNow={practiceActions.randomizeScaleNow}
      />
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
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
      </ErrorBoundary>
      <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[fileBase]}>
        <ExportControls
          boardRef={boardRef}
          fileBase={fileBase}
          downloadPNG={downloadPNG}
          downloadSVG={downloadSVG}
          printFretboard={printFretboard}
          buildHeader={buildHeader}
          exportCurrent={() => exportCurrent(tuning, stringMeta, boardMeta)}
          exportAll={exportAll}
          importFromJson={importFromJson}
          onClearCustom={clearAllPacks}
          onManageCustom={openManager}
        />
      </ErrorBoundary>
    </>
  );

  const modals = (
    <>
      {editorState ? (
        <React.Suspense
          fallback={
            <div className="tv-modal-suspense" role="status" aria-live="polite">
              Loading editor...
            </div>
          }
        >
          <TuningPackEditorModal
            isOpen={Boolean(editorState)}
            mode={editorState?.mode ?? "create"}
            initialPack={editorState?.initialPack}
            originalName={editorState?.originalName ?? undefined}
            onCancel={cancelEditor}
            onSubmit={submitEditor}
            themeMode={themeMode}
          />
        </React.Suspense>
      ) : null}
      {isManagerOpen ? (
        <React.Suspense
          fallback={
            <div className="tv-modal-suspense" role="status" aria-live="polite">
              Loading manager...
            </div>
          }
        >
          <TuningPackManagerModal
            isOpen={isManagerOpen}
            tunings={customTunings}
            systems={TUNINGS}
            themeMode={themeMode}
            onClose={closeManager}
            onEdit={editFromManager}
            onDelete={deletePack}
          />
        </React.Suspense>
      ) : null}
    </>
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
