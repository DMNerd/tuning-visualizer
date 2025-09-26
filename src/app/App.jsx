// App.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
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

// hotkeys
import HotkeysHelpToast from "@/components/UI/HotkeysCheatsheet";

// theory
import { TUNINGS } from "@/lib/theory/tuning";
import { ALL_SCALES } from "@/lib/theory/scales";
import {
  PRESET_TUNING_META,
  STR_MIN,
  STR_MAX,
  FRETS_MIN,
  FRETS_MAX,
  STR_FACTORY,
  FRETS_FACTORY,
  getFactoryFrets,
  SYSTEM_DEFAULT,
  ROOT_DEFAULT,
  CAPO_DEFAULT,
  DISPLAY_DEFAULTS,
} from "@/lib/theory/constants";

import { DEFAULT_TUNINGS, PRESET_TUNINGS } from "@/lib/theory/presetState";

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
import { useInstrumentPrefs } from "@/hooks/useInstrumentPrefs";
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
    });

  // Reset meta and preset label when system or string count changes
  useEffect(() => {
    setStringMeta(null);
    resetSelection();
  }, [systemId, strings, resetSelection]);

  const labelValues = useMemo(() => LABEL_OPTIONS.map((o) => o.value), []);

  const showCheatsheet = useCallback(() => {
    toast(() => <HotkeysHelpToast />, {
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
    labelValues,
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

  // ===== Quick Capo =====
  const [capoFret, setCapoFret] = useState(CAPO_DEFAULT);

  const handleSetCapo = (f) => {
    setCapoFret((prev) => (prev === f ? CAPO_DEFAULT : f));
  };

  const effectiveStringMeta = useMemo(() => {
    if (capoFret === 0) return stringMeta;
    if (!strings || strings <= 0) return stringMeta;

    const base = Array.isArray(stringMeta) ? stringMeta : [];
    const byIx = new Map(base.map((m) => [m.index, m]));

    const alreadyOk =
      base.length > 0 &&
      base.every((m) => {
        const sf = typeof m.startFret === "number" ? m.startFret : 0;
        return sf >= capoFret && (sf === 0 || m.greyBefore === true);
      });

    if (alreadyOk && base.length === strings) return stringMeta;

    const out = [];
    for (let i = 0; i < strings; i++) {
      const m = byIx.get(i) || {};
      const baseStart = typeof m.startFret === "number" ? m.startFret : 0;
      const nextStart = Math.max(baseStart, capoFret);

      if (nextStart > 0 || m.greyBefore) {
        out.push({
          index: i,
          ...m,
          startFret: nextStart,
          greyBefore: true,
        });
      } else if (Object.keys(m).length) {
        out.push({ index: i, ...m });
      }
    }

    return out.length ? out : null;
  }, [strings, stringMeta, capoFret]);
  // ======================

  // ===== Reset-to-factory handler =====
  const handleResetFactoryAll = () => {
    const factoryFrets = getFactoryFrets(system.divisions);
    resetInstrumentPrefs(STR_FACTORY, factoryFrets);
    resetFactoryDefault();
    setPreset("Factory default");
    toast.success(
      `Restored factory defaults (${STR_FACTORY} strings, ${factoryFrets} frets).`,
    );
  };

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
              stringMeta={effectiveStringMeta}
              capoFret={capoFret}
              onSetCapo={handleSetCapo}
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
          handleSaveDefault={saveDefault}
          handleResetFactoryDefault={handleResetFactoryAll}
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
