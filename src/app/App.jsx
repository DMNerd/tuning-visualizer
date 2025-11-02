import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import clsx from "clsx";
import { ErrorBoundary } from "react-error-boundary";
import {
  FiMaximize,
  FiMinimize,
  FiRotateCcw,
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

// theory
import { TUNINGS } from "@/lib/theory/tuning";
import { ALL_SCALES } from "@/lib/theory/scales";
import { PRESET_TUNING_META } from "@/lib/presets/presets";

import {
  STR_MIN,
  STR_MAX,
  FRETS_MIN,
  FRETS_MAX,
  STR_FACTORY,
  getFactoryFrets,
  SYSTEM_DEFAULT,
  ROOT_DEFAULT,
  CAPO_DEFAULT,
  DISPLAY_DEFAULTS,
  SCALE_DEFAULT,
} from "@/lib/config/appDefaults";

import { DEFAULT_TUNINGS, PRESET_TUNINGS } from "@/lib/presets/presetState";

// existing UI atoms
import PanelHeader from "@/components/UI/PanelHeader";
import TuningSystemSelector from "@/components/UI/TuningSystemSelector";
import ScaleControls from "@/components/UI/ScaleControls";
import DisplayControls from "@/components/UI/DisplayControls";
import InstrumentControls from "@/components/UI/InstrumentControls";
import ExportControls from "@/components/UI/ExportControls";
import ChordBuilder from "@/components/UI/ChordBuilder";
import ErrorFallback from "@/components/UI/ErrorFallback";
const TuningPackEditorModal = React.lazy(
  () => import("@/components/UI/TuningPackEditorModal"),
);
const TuningPackManagerModal = React.lazy(
  () => import("@/components/UI/TuningPackManagerModal"),
);

// hooks
import { useTheme } from "@/hooks/useTheme";
import { useScaleOptions } from "@/hooks/useScaleOptions";
import { useDrawFrets } from "@/hooks/useDrawFrets";
import { useDefaultTuning } from "@/hooks/useDefaultTuning";
import { useStringsChange } from "@/hooks/useStringsChange";
import { useDisplayPrefs } from "@/hooks/useDisplayPrefs";
import { useInstrumentPrefs } from "@/hooks/useInstrumentPrefs";
import { useSystemPrefs } from "@/hooks/useSystemPrefs";
import { useTuningIO } from "@/hooks/useTuningIO";
import { useMergedPresets } from "@/hooks/useMergedPresets";
import { useFretsTouched } from "@/hooks/useFretsTouched";
import { useSystemNoteNames } from "@/hooks/useSystemNoteNames";
import { useAccidentalRespell } from "@/hooks/useAccidentalRespell";
import { useChordLogic } from "@/hooks/useChordLogic";
import { useFileBase } from "@/hooks/useFileBase";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useCapo } from "@/hooks/useCapo";
import { useResets } from "@/hooks/useResets";
import { useConfirm } from "@/hooks/useConfirm";
import { LABEL_VALUES } from "@/hooks/useLabels";
import { useCustomTuningPacks } from "@/hooks/useCustomTuningPacks";
import { useRandomScale } from "@/hooks/useRandomScale";
import { useFullscreen, useToggle } from "react-use";

export default function App() {
  // System selection
  const { systemId, setSystemId, root, setRoot, ensureValidRoot } =
    useSystemPrefs({
      tunings: TUNINGS,
      defaultSystemId: SYSTEM_DEFAULT,
      defaultRoot: ROOT_DEFAULT,
    });

  const system = TUNINGS[systemId];

  // Strings / Frets
  const { frets, setFrets, fretsTouched, setFretsUI, setFretsTouched } =
    useFretsTouched(getFactoryFrets(system.divisions));

  const { strings, setStrings, resetInstrumentPrefs, setFretsPref } =
    useInstrumentPrefs({
      frets,
      fretsTouched,
      setFrets,
      setFretsUI,
      setFretsTouched,
      STR_MIN,
      STR_MAX,
      FRETS_MIN,
      FRETS_MAX,
      STR_FACTORY,
    });

  // Display options
  const [displayPrefs, setDisplayPrefs, displaySetters] =
    useDisplayPrefs(DISPLAY_DEFAULTS);
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

  const [theme, setTheme, themeMode] = useTheme();

  const { confirm } = useConfirm();

  // Refs
  const boardRef = useRef(null);
  const stageRef = useRef(null);

  // Fullscreen (react-use)
  const [isFsRequested, toggleFs] = useToggle(false);
  const isFs = useFullscreen(stageRef, isFsRequested, {
    onClose: () => toggleFs(false),
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isFs) root.classList.add("is-fs");
    else root.classList.remove("is-fs");
    return () => root.classList.remove("is-fs");
  }, [isFs]);

  // Tuning (defaults + presets + meta)
  const {
    tuning,
    setTuning,
    presetMap,
    presetMetaMap,
    presetNames,
    saveDefault,
    savedExists,
    defaultForCount,
  } = useDefaultTuning({
    systemId,
    strings,
    DEFAULT_TUNINGS,
    PRESET_TUNINGS,
    PRESET_TUNING_META,
  });

  const [stringMeta, setStringMeta] = useState(null);
  const [boardMeta, setBoardMeta] = useState(null);

  const handleSaveDefault = useCallback(() => {
    saveDefault(stringMeta, boardMeta);
  }, [saveDefault, stringMeta, boardMeta]);

  const { pcFromName, nameForPc, sysNames } = useSystemNoteNames(
    system,
    accidental,
  );
  useEffect(() => {
    ensureValidRoot(sysNames);
  }, [ensureValidRoot, sysNames]);

  const rootIx = useMemo(() => pcFromName(root), [root, pcFromName]);

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

  const drawFrets = useDrawFrets({
    baseFrets: frets,
    divisions: system.divisions,
    fretsTouched,
    setFretsRaw: setFrets,
  });

  const fileBase = useFileBase({ root, scale, accidental, strings });

  useAccidentalRespell({
    system,
    accidental,
    setRoot,
    setTuning,
    setChordRoot,
  });

  const handleStringsChange = useStringsChange({
    setStrings,
    setTuning,
    defaultForCount,
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
  } = useTuningIO({ systemId, strings, TUNINGS });

  const {
    mergedPresetNames,
    customPresetNames,
    selectedPreset,
    setPreset,
    queuePresetByName,
  } = useMergedPresets({
    presetMap,
    presetMetaMap,
    presetNames,
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

  const {
    randomize: randomizeScale,
    triggerFromHotkey: triggerRandomizeScale,
  } = useRandomScale({
    sysNames,
    scaleOptions,
    setRoot,
    setScale,
    throttleMs: 150,
  });

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

  const { capoFret, setCapoFret, toggleCapoAt, effectiveStringMeta } = useCapo({
    strings,
    stringMeta,
  });

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
    onRandomizeScale: triggerRandomizeScale,
    onCreateCustomPack: openCreate,
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

  return (
    <div className="tv-shell">
      <header className="tv-shell__header">
        <PanelHeader theme={theme} setTheme={setTheme} />
      </header>
      <main className="tv-shell__main">
        <div className="tv-stage" ref={stageRef}>
          <div
            className={clsx("tv-stage__surface", { "is-lefty": lefty })}
            onDoubleClick={() => toggleFs()}
          >
            <div className="tv-stage__toolbar">
              <button
                type="button"
                className="tv-button tv-button--icon"
                aria-label="Reset all to defaults"
                onClick={() => resetAll({ confirm: true })}
                title="Reset all to defaults"
              >
                <FiRotateCcw size={16} aria-hidden />
              </button>
              <button
                type="button"
                className={clsx(
                  "tv-button",
                  "tv-button--icon",
                  "tv-button--fullscreen",
                  { "is-active": isFs },
                )}
                aria-label={
                  isFs ? "Exit fullscreen (Esc)" : "Enter fullscreen (F)"
                }
                onClick={() => toggleFs()}
                title={isFs ? "Exit fullscreen (Esc)" : "Enter fullscreen (F)"}
              >
                {isFs ? (
                  <FiMinimize size={16} aria-hidden />
                ) : (
                  <FiMaximize size={16} aria-hidden />
                )}
              </button>
            </div>
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
      </main>
      <footer className="tv-shell__controls">
        <TuningSystemSelector
          systemId={systemId}
          setSystemId={setSystemId}
          systems={TUNINGS}
        />
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
            onRandomize={randomizeScale}
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
            supportsMicrotonal={system.divisions === 24}
            system={system}
            rootIx={rootIx}
            intervals={intervals}
            chordPCs={chordPCs}
            chordRootPc={chordRootIx}
          />
        </ErrorBoundary>
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
            sysNames={sysNames}
            tuning={tuning}
            setTuning={setTuning}
            handleStringsChange={handleStringsChange}
            presetNames={mergedPresetNames}
            customPresetNames={customPresetNames}
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
      </footer>
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
    </div>
  );
}
