// App.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
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
} from "@/lib/export/exporters";

// fretboard
import Fretboard from "@/components/Fretboard/Fretboard";

// theory
import { TUNINGS } from "@/lib/theory/tuning";
import { ALL_SCALES } from "@/lib/theory/scales";
import {
  DEFAULT_TUNINGS,
  PRESET_TUNINGS,
  PRESET_TUNING_META,
} from "@/lib/theory/constants";

// existing UI atoms
import PanelHeader from "@/components/UI/PanelHeader";
import TuningSystemSelector from "@/components/UI/TuningSystemSelector";
import ScaleControls from "@/components/UI/ScaleControls";
import DisplayControls from "@/components/UI/DisplayControls";
import InstrumentControls from "@/components/UI/InstrumentControls";
import ExportControls from "@/components/UI/ExportControls";
import ChordBuilder from "@/components/UI/ChordBuilder";

// hooks
import { useTheme } from "@/hooks/useTheme";
import { useScaleOptions } from "@/hooks/useScaleOptions";
import { useDrawFrets } from "@/hooks/useDrawFrets";
import { useDefaultTuning } from "@/hooks/useDefaultTuning";
import { useStringsChange } from "@/hooks/useStringsChange";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useDisplayPrefs } from "@/hooks/useDisplayPrefs";
import { useTuningIO } from "@/hooks/useTuningIO";
import { useMergedPresets } from "@/hooks/useMergedPresets";
import { useFretsTouched } from "@/hooks/useFretsTouched";
import { useSystemNoteNames } from "@/hooks/useSystemNoteNames";
import { useAccidentalRespell } from "@/hooks/useAccidentalRespell";
import { useChordLogic } from "@/hooks/useChordLogic";
import { useFileBase } from "@/hooks/useFileBase";
import { useHotkeys } from "@/hooks/useHotkeys";
import { LABEL_OPTIONS } from "@/hooks/useLabels";

export default function App() {
  // ----- System selection -----
  const [systemId, setSystemId] = useState("12-TET");
  const system = TUNINGS[systemId];

  // ----- Strings / Frets (via hook) -----
  const { frets, setFrets, fretsTouched, setFretsUI } = useFretsTouched(22);
  const [strings, setStrings] = useState(6);

  // ----- Root & accidental -----
  const [root, setRoot] = useState("C");

  // ----- Display options (persistent) -----
  const [displayPrefs, setDisplayPrefs] = useDisplayPrefs({
    show: "names",
    showOpen: true,
    showFretNums: true,
    dotSize: 14,
    lefty: false,
    openOnlyInScale: false,
    colorByDegree: false,
    accidental: "sharp",
    microLabelStyle: "letters",
  });

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

  const updatePref = (key) => (val) =>
    setDisplayPrefs((prev) => ({ ...prev, [key]: val }));

  const [theme, setTheme] = useTheme();

  // Refs
  const boardRef = useRef(null);
  const stageRef = useRef(null);

  const { isActive: isFs, toggle: toggleFs } = useFullscreen(stageRef, {
    hotkey: true,
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
    loadSavedDefault,
    resetFactoryDefault,
    savedExists,
    defaultForCount,
  } = useDefaultTuning({
    systemId,
    strings,
    DEFAULT_TUNINGS,
    PRESET_TUNINGS,
    PRESET_TUNING_META,
  });

  // Per-string metadata (e.g., short banjo string)
  const [stringMeta, setStringMeta] = useState(null);

  // ----- System note names (via hook) -----
  const { pcFromName, sysNames } = useSystemNoteNames(system, accidental);

  // Root index for fretboard
  const rootIx = useMemo(() => pcFromName(root), [root, pcFromName]);

  // ----- Chords (via hook) -----
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

  // ----- Export filename base (via hook) -----
  const fileBase = useFileBase({ root, scale, accidental, strings });

  // ----- Accidental respelling (via hook) -----
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

  // ----- Tuning IO (persist imported tunings + exporter fns) -----
  const {
    customTunings,
    getCurrentTuningPack,
    getAllCustomTunings,
    onImportTunings,
  } = useTuningIO({
    systemId,
    strings,
    TUNINGS,
  });

  // ----- Merge presets + manage selection (filter customs by current EDO) -----
  const { mergedPresetNames, selectedPreset, setPreset, resetSelection } =
    useMergedPresets({
      presetMap,
      presetMetaMap,
      presetNames,
      customTunings,
      setTuning,
      setStringMeta,
      currentEdo: system.divisions,
    });

  // Reset meta and preset label when system or string count changes
  useEffect(() => {
    setStringMeta(null);
    resetSelection();
  }, [systemId, strings, resetSelection]);

  const labelValues = useMemo(() => LABEL_OPTIONS.map((o) => o.value), []);

  useHotkeys({
    toggleFs,
    setDisplayPrefs,
    setFrets: setFretsUI,
    handleStringsChange,
    setShowChord,
    setHideNonChord,
    strings,
    frets,
    labelValues,
    onShowCheatsheet: () => {
      toast(
        () => (
          <div className="hotkeys-toast">
            <b>Hotkeys</b>
            <ul>
              <li>
                <kbd>f</kbd> fullscreen
              </li>
              <li>
                <kbd>?</kbd> show this help
              </li>
              <li>
                <kbd>l</kbd> cycle labels
              </li>
              <li>
                <kbd>o</kbd> toggle open notes
              </li>
              <li>
                <kbd>n</kbd> toggle fret numbers
              </li>
              <li>
                <kbd>d</kbd> color by degree
              </li>
              <li>
                <kbd>a</kbd> sharps ↔ flats
              </li>
              <li>
                <kbd>g</kbd> left-handed layout
              </li>
              <li>
                <kbd>c</kbd> chord overlay
              </li>
              <li>
                <kbd>h</kbd> hide non-chord tones
              </li>
              <li>
                <kbd>[ / ]</kbd> strings − / ＋
              </li>
              <li>
                <kbd>- / =</kbd> frets − / ＋
              </li>
              <li>
                <kbd>, / .</kbd> dot size − / ＋
              </li>
            </ul>
          </div>
        ),
        { id: "hotkeys-help" },
      );
    },
  });

  useEffect(() => {
    if (savedExists) {
      setPreset("Saved default");
    } else {
      setPreset("Factory default");
    }
  }, [systemId, strings, savedExists, setPreset]);

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
                className={`icon-btn fs-btn${isFs ? " active" : ""}`}
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
              stringMeta={stringMeta}
            />
          </div>
        </div>
      </main>

      <footer className="page-controls">
        <TuningSystemSelector
          systemId={systemId}
          setSystemId={setSystemId}
          systems={TUNINGS}
        />

        <ScaleControls
          root={root}
          setRoot={setRoot}
          scale={scale}
          setScale={setScale}
          sysNames={sysNames}
          scaleOptions={scaleOptions}
        />

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
          savedExists={savedExists}
          handleSaveDefault={saveDefault}
          handleLoadSavedDefault={loadSavedDefault}
          handleResetFactoryDefault={resetFactoryDefault}
          systemId={systemId}
        />

        <DisplayControls
          show={show}
          setShow={updatePref("show")}
          showOpen={showOpen}
          setShowOpen={updatePref("showOpen")}
          showFretNums={showFretNums}
          setShowFretNums={updatePref("showFretNums")}
          dotSize={dotSize}
          setDotSize={updatePref("dotSize")}
          accidental={accidental}
          setAccidental={updatePref("accidental")}
          microLabelStyle={microLabelStyle}
          setMicroLabelStyle={updatePref("microLabelStyle")}
          openOnlyInScale={openOnlyInScale}
          setOpenOnlyInScale={updatePref("openOnlyInScale")}
          colorByDegree={colorByDegree}
          setColorByDegree={updatePref("colorByDegree")}
          lefty={lefty}
          setLefty={updatePref("lefty")}
        />

        <ExportControls
          boardRef={boardRef}
          fileBase={slug(fileBase)}
          downloadPNG={downloadPNG}
          downloadSVG={downloadSVG}
          printFretboard={printFretboard}
          buildHeader={() => ({
            system: systemId,
            tuning: tuning,
            scale: scale,
            chordEnabled: showChord,
            chordRoot: chordRoot,
            chordType: chordType,
          })}
          getCurrentTuningPack={() => getCurrentTuningPack(tuning, stringMeta)}
          getAllCustomTunings={getAllCustomTunings}
          onImportTunings={onImportTunings}
        />
      </footer>

      {/* Toasts: styled with your CSS variables for perfect cohesion */}
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
