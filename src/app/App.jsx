// App.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { FiMaximize, FiMinimize } from "react-icons/fi";

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
import { buildChordPCsFromPc } from "@/lib/theory/chords";

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
import { usePitchMapping } from "@/hooks/usePitchMapping";
import { useStringsChange } from "@/hooks/useStringsChange";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useDisplayPrefs } from "@/hooks/useDisplayPrefs";

export default function App() {
  // ----- System selection -----
  const [systemId, setSystemId] = useState("12-TET");
  const system = TUNINGS[systemId];

  // ----- Strings / Frets -----
  const [strings, setStrings] = useState(6);
  const [frets, setFrets] = useState(22);
  const [fretsTouched, setFretsTouched] = useState(false);

  const setFretsUI = (val) => {
    setFrets(val);
    setFretsTouched(true);
  };

  // ----- Root & accidental -----
  const [root, setRoot] = useState("C");

  // ----- Chords -----
  const [chordRoot, setChordRoot] = useState("C");
  const [chordType, setChordType] = useState("maj");
  const [showChord, setShowChord] = useState(false);
  const [hideNonChord, setHideNonChord] = useState(false);

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

  const [selectedPreset, setSelectedPreset] = useState("Factory default");
  const [stringMeta, setStringMeta] = useState(null);

  useEffect(() => {
    setSelectedPreset("Factory default");
    setStringMeta(null); // clear meta when system/strings change
  }, [systemId, strings]);

  // ----- System note names -----
  const { pcForName: pcFromName, nameForPc } = usePitchMapping(
    system,
    accidental,
  );
  const sysNames = useMemo(
    () => Array.from({ length: system.divisions }, (_, pc) => nameForPc(pc)),
    [system.divisions, nameForPc],
  );

  const rootIx = useMemo(() => pcFromName(root), [root, pcFromName]);
  const chordRootIx = useMemo(
    () => pcFromName(chordRoot),
    [chordRoot, pcFromName],
  );

  const chordPCs = useMemo(
    () =>
      showChord
        ? buildChordPCsFromPc(chordRootIx, chordType, system.divisions)
        : null,
    [showChord, chordRootIx, chordType, system.divisions],
  );

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
  const fileBase = useMemo(
    () => slug(root, scale, accidental, `${strings}str`),
    [root, scale, accidental, strings],
  );

  // ----- Accidental respelling (guarded) -----
  useEffect(() => {
    const toName = (pc) => system.nameForPc(pc, accidental);

    setRoot((prev) => {
      const next = toName(pcFromName(prev));
      return next !== prev ? next : prev;
    });

    setTuning((prev) => {
      const next = prev.map((n) => toName(pcFromName(n)));
      const same =
        prev.length === next.length && prev.every((v, i) => v === next[i]);
      return same ? prev : next;
    });

    setChordRoot((prev) => {
      const next = toName(pcFromName(prev));
      return next !== prev ? next : prev;
    });
  }, [accidental, system, pcFromName, setTuning]);

  const handleStringsChange = useStringsChange({
    setStrings,
    setTuning,
    defaultForCount,
  });

  const setPreset = (name) => {
    setSelectedPreset(name);

    const arr = presetMap[name];
    if (Array.isArray(arr) && arr.length) setTuning(arr);

    const meta = presetMetaMap?.[name] ?? null;
    setStringMeta(meta);
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
          presetNames={presetNames}
          selectedPreset={selectedPreset}
          setSelectedPreset={setPreset} // ← uses meta-aware selection
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
        />
      </footer>
    </div>
  );
}
