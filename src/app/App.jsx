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
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiLoader,
} from "react-icons/fi";
import { Toaster, ToastBar, toast } from "react-hot-toast";

// exporters
import {
  downloadPNG,
  downloadSVG,
  printFretboard,
  slug,
} from "@/lib/export/scales";

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

// hooks
import { useTheme } from "@/hooks/useTheme";
import { useScaleOptions } from "@/hooks/useScaleOptions";
import { useDrawFrets } from "@/hooks/useDrawFrets";
import { useDefaultTuning } from "@/hooks/useDefaultTuning";
import { useStringsChange } from "@/hooks/useStringsChange";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useDisplayPrefs } from "@/hooks/useDisplayPrefs";
import { useInstrumentPrefs } from "@/hooks/useInstrumentPrefs";
import { useTuningIO } from "@/hooks/useTuningIO";
import { useMergedPresets } from "@/hooks/useMergedPresets";
import { useFretsTouched } from "@/hooks/useFretsTouched";
import { useSystemNoteNames } from "@/hooks/useSystemNoteNames";
import { useAccidentalRespell } from "@/hooks/useAccidentalRespell";
import { useChordLogic } from "@/hooks/useChordLogic";
import { useFileBase } from "@/hooks/useFileBase";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useCapo } from "@/hooks/useCapo";
import { LABEL_VALUES } from "@/hooks/useLabels";

import { makeImmerSetters } from "@/utils/makeImmerSetters";

export default function App() {
  // ----- System selection -----
  const [systemId, setSystemId] = useState(SYSTEM_DEFAULT);
  const system = TUNINGS[systemId];

  // ----- Strings / Frets (via hooks) -----
  const { frets, setFrets, fretsTouched, setFretsUI, setFretsTouched } =
    useFretsTouched(getFactoryFrets(system.divisions));

  const { strings, setStrings, resetInstrumentPrefs } = useInstrumentPrefs({
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

  // ----- Root & accidental -----
  const [root, setRoot] = useState(ROOT_DEFAULT);

  // ----- Display options (persistent) -----
  const [displayPrefs, setDisplayPrefs] = useDisplayPrefs(DISPLAY_DEFAULTS);

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
  } = useMemo(
    () =>
      makeImmerSetters(setDisplayPrefs, [
        "show",
        "showOpen",
        "showFretNums",
        "dotSize",
        "accidental",
        "microLabelStyle",
        "openOnlyInScale",
        "colorByDegree",
        "lefty",
      ]),
    [setDisplayPrefs],
  );

  const [theme, setTheme] = useTheme();

  // Refs
  const boardRef = useRef(null);
  const stageRef = useRef(null);

  const { isActive: isFs, toggle: toggleFs } = useFullscreen(stageRef, {
    docClass: "is-fs",
  });

  // ----- Tuning (defaults + presets + meta) -----
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

  // Per-string metadata (base)
  const [stringMeta, setStringMeta] = useState(null);

  // ----- System note names -----
  const { pcFromName, sysNames } = useSystemNoteNames(system, accidental);
  const rootIx = useMemo(() => pcFromName(root), [root, pcFromName]);

  // ----- Chords -----
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

  // ----- Scales -----
  const { scale, setScale, scaleOptions, intervals } = useScaleOptions({
    system,
    ALL_SCALES,
    initial: "Major (Ionian)",
  });

  // ----- Draw-frets normalization -----
  const drawFrets = useDrawFrets({
    baseFrets: frets,
    divisions: system.divisions,
    fretsTouched,
    setFretsRaw: setFrets,
  });

  // ----- Export filename base -----
  const fileBase = useFileBase({ root, scale, accidental, strings });
  const fileBaseSlug = useMemo(() => slug(fileBase), [fileBase]);

  // ----- Accidental respelling -----
  useAccidentalRespell({
    system,
    accidental,
    pcFromName,
    setRoot,
    setTuning,
    setChordRoot,
  });

  const handleStringsChange = useStringsChange({
    setStrings,
    setTuning,
    defaultForCount,
  });

  // ----- Tuning IO -----
  const { customTunings, importFromJson, exportCurrent, exportAll } =
    useTuningIO({ systemId, strings, TUNINGS });

  // ----- Merge presets -----
  const { mergedPresetNames, selectedPreset, setPreset, resetSelection } =
    useMergedPresets({
      presetMap,
      presetMetaMap,
      presetNames,
      customTunings,
      setTuning,
      setStringMeta,
      currentEdo: system.divisions,
      currentStrings: strings,
    });

  // Reset meta and preset label when system or string count changes
  useEffect(() => {
    setStringMeta(null);
    resetSelection();
  }, [systemId, strings, resetSelection]);

  // Normal-load cheatsheet opener
  const showCheatsheet = useCallback(() => {
    toast((t) => <HotkeysCheatsheet onClose={() => toast.dismiss(t.id)} />, {
      id: "hotkeys-help",
      duration: 6000,
    });
  }, []);

  useHotkeys({
    toggleFs,
    setDisplayPrefs,
    setFrets: setFretsUI,
    handleStringsChange,
    setShowChord,
    setHideNonChord,
    strings,
    frets,
    LABEL_VALUES,
    onShowCheatsheet: showCheatsheet,
    minStrings: STR_MIN,
    maxStrings: STR_MAX,
    minFrets: FRETS_MIN,
    maxFrets: FRETS_MAX,
  });

  // Keep preset label synced with presence of a saved default
  useEffect(() => {
    if (savedExists) setPreset("Saved default");
    else setPreset("Factory default");
  }, [systemId, strings, savedExists, setPreset]);

  // ----- Capo (extracted hook) -----
  const { capoFret, setCapoFret, toggleCapoAt, effectiveStringMeta } = useCapo({
    strings,
    stringMeta,
  });

  // ----- Reset-to-factory handler -----
  const handleResetFactoryAll = useCallback(() => {
    const factoryFrets = getFactoryFrets(system.divisions);
    resetInstrumentPrefs(STR_FACTORY, factoryFrets);
    setCapoFret(CAPO_DEFAULT);
  }, [system.divisions, resetInstrumentPrefs, setCapoFret]);

  // Stable export header builder
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
    <div className="page">
      <header className="page-header">
        <PanelHeader theme={theme} setTheme={setTheme} />
      </header>

      <main className="page-main">
        <div className="stage fb-stage" ref={stageRef}>
          <div className="fretboard-wrap" onDoubleClick={toggleFs}>
            <div className="stage-toolbar">
              <button
                type="button"
                className={clsx("icon-btn", "fs-btn", { active: isFs })}
                aria-label={
                  isFs ? "Exit fullscreen (Esc)" : "Enter fullscreen (F)"
                }
                onClick={toggleFs}
                title={isFs ? "Exit fullscreen (Esc)" : "Enter fullscreen (F)"}
              >
                {isFs ? (
                  <FiMinimize size={16} aria-hidden={true} />
                ) : (
                  <FiMaximize size={16} aria-hidden={true} />
                )}
              </button>
            </div>

            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => {
                setCapoFret(CAPO_DEFAULT);
                setRoot(ROOT_DEFAULT);
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
                capoFret={capoFret}
                onSetCapo={toggleCapoAt}
              />
            </ErrorBoundary>
          </div>
        </div>
      </main>

      <footer className="page-controls">
        <TuningSystemSelector
          systemId={systemId}
          setSystemId={setSystemId}
          systems={TUNINGS}
        />

        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          resetKeys={[systemId, root, scale]}
          onReset={() => {
            setRoot(ROOT_DEFAULT);
          }}
        >
          <ScaleControls
            root={root}
            setRoot={setRoot}
            scale={scale}
            setScale={setScale}
            sysNames={sysNames}
            scaleOptions={scaleOptions}
          />
        </ErrorBoundary>

        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          resetKeys={[chordRoot, chordType, showChord, hideNonChord]}
          onReset={() => {
            setChordRoot(ROOT_DEFAULT);
            setShowChord(false);
            setHideNonChord(false);
          }}
        >
          <ChordBuilder
            root={chordRoot}
            onRootChange={setChordRoot}
            sysNames={sysNames}
            type={chordType}
            onTypeChange={setChordType}
            showChord={showChord}
            setShowChord={setShowChord}
            hideNonChord={hideNonChord}
            setHideNonChord={setHideNonChord}
          />
        </ErrorBoundary>

        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          resetKeys={[strings, frets, systemId]}
          onReset={() => {
            setStrings(STR_FACTORY);
            setFretsUI(getFactoryFrets(system.divisions));
          }}
        >
          <InstrumentControls
            strings={strings}
            setStrings={setStrings}
            frets={frets}
            setFrets={setFretsUI}
            sysNames={sysNames}
            tuning={tuning}
            setTuning={setTuning}
            handleStringsChange={handleStringsChange}
            presetNames={mergedPresetNames}
            selectedPreset={selectedPreset}
            setSelectedPreset={setPreset}
            handleSaveDefault={saveDefault}
            handleResetFactoryDefault={handleResetFactoryAll}
            systemId={systemId}
          />
        </ErrorBoundary>

        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          resetKeys={[displayPrefs]}
          onReset={() => {
            setDisplayPrefs(DISPLAY_DEFAULTS);
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

        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          resetKeys={[fileBaseSlug]}
          onReset={() => {}}
        >
          <ExportControls
            boardRef={boardRef}
            fileBase={fileBaseSlug}
            downloadPNG={downloadPNG}
            downloadSVG={downloadSVG}
            printFretboard={printFretboard}
            buildHeader={buildHeader}
            exportCurrent={() => exportCurrent(tuning, stringMeta)}
            exportAll={exportAll}
            importFromJson={importFromJson}
          />
        </ErrorBoundary>
      </footer>

      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 2800,
          style: {
            background: "var(--card-bg)",
            color: "var(--fg)",
            border: "1px solid var(--card-border)",
            boxShadow: "var(--card-shadow)",
            padding: "8px 10px",
            fontSize: "0.8125rem",
            borderRadius: "10px",
          },
        }}
      >
        {(t) => {
          const icon =
            t.type === "success" ? (
              <FiCheckCircle size={18} color="var(--accent)" />
            ) : t.type === "error" ? (
              <FiAlertTriangle size={18} color="var(--root)" />
            ) : t.type === "loading" ? (
              <FiLoader size={18} className="spin" />
            ) : (
              <FiInfo size={18} color="var(--fg)" />
            );

          return (
            <ToastBar toast={t}>
              {({ message, action }) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {icon}
                  </span>
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
