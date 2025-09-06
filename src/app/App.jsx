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
import { DEFAULT_TUNINGS, PRESET_TUNINGS } from "@/lib/theory/constants";
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

export default function App() {
  // ----- System selection -----
  const [systemId, setSystemId] = useState("12-TET");
  const system = TUNINGS[systemId];

  // ----- Strings / Frets -----
  const [strings, setStrings] = useState(6);
  const [frets, setFrets] = useState(22);
  const [fretsTouched, setFretsTouched] = useState(false);

  // wrapped setter to mark user interaction
  const setFretsUI = (val) => {
    setFrets(val);
    setFretsTouched(true);
  };

  // ----- Root & accidental -----
  const [root, setRoot] = useState("C");
  const [accidental, setAccidental] = useState("sharp"); // "sharp" | "flat"

  // ----- Chords -----
  const [chordRoot, setChordRoot] = useState("C");
  const [chordType, setChordType] = useState("maj");
  const [showChord, setShowChord] = useState(false);

  // ----- Display options -----
  const [show, setShow] = useState("names");
  const [showOpen, setShowOpen] = useState(true);
  const [showFretNums, setShowFretNums] = useState(true);
  const [dotSize, setDotSize] = useState(14);
  const [lefty, setLefty] = useState(false);
  const [theme, setTheme] = useTheme();
  const [openOnlyInScale, setOpenOnlyInScale] = useState(false);
  const [colorByDegree, setColorByDegree] = useState(false);

  // Refs
  const boardRef = useRef(null);
  const stageRef = useRef(null);

  // ----- Fullscreen controls for the stage -----
  const { isActive: isFs, toggle: toggleFs } = useFullscreen(stageRef, {
    hotkey: true,
    docClass: "is-fs",
  });

  // ----- Tuning (defaults + presets) via hook -----
  const {
    tuning,
    setTuning,
    presetMap,
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
  });

  // Preset selection UI state
  const [selectedPreset, setSelectedPreset] = useState("Factory default");
  useEffect(() => {
    setSelectedPreset("Factory default");
  }, [systemId, strings]);

  // ----- System note names (spelled by accidental) -----
  const { pcForName: pcFromName, nameForPc } = usePitchMapping(
    system,
    accidental,
  );
  const sysNames = useMemo(
    () => Array.from({ length: system.divisions }, (_, pc) => nameForPc(pc)),
    [system.divisions, nameForPc],
  );

  // Root/chord indices
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

  // ----- Scales for system via hook -----
  const { scale, setScale, scaleOptions, intervals } = useScaleOptions({
    system,
    ALL_SCALES,
    initial: "Major (Ionian)",
  });

  // ----- Draw-fret normalization across systems via hook -----
  const drawFrets = useDrawFrets({
    baseFrets: frets,
    divisions: system.divisions,
    fretsTouched,
    setFretsRaw: setFrets, // raw setter (not setFretsUI)
  });

  // ----- Export filename base -----
  const fileBase = useMemo(
    () => slug(root, scale, accidental, `${strings}str`),
    [root, scale, accidental, strings],
  );

  // ----- Accidental respelling (guarded) -----
  useEffect(() => {
    const toName = (pc) => system.nameForPc(pc, accidental);

    // root
    setRoot((prev) => {
      const next = toName(pcFromName(prev));
      return next !== prev ? next : prev;
    });

    // tuning
    setTuning((prev) => {
      const next = prev.map((n) => toName(pcFromName(n)));
      const same =
        prev.length === next.length && prev.every((v, i) => v === next[i]);
      return same ? prev : next;
    });

    // chord root
    setChordRoot((prev) => {
      const next = toName(pcFromName(prev));
      return next !== prev ? next : prev;
    });
  }, [accidental, system, pcFromName, setTuning]);

  // ----- Strings count change handler (preserve intent) -----
  const handleStringsChange = useStringsChange({
    setStrings,
    setTuning,
    defaultForCount,
  });

  return (
    <div className="page">
      {/* Top-of-page header (not overlaying the stage) */}
      <header className="page-header">
        <PanelHeader
          theme={theme}
          setTheme={setTheme}
          lefty={lefty}
          setLefty={setLefty}
        />
      </header>

      {/* Fretboard stage */}
      <main className="page-main">
        <div className="stage fb-stage" ref={stageRef}>
          <div className="fretboard-wrap" onDoubleClick={toggleFs}>
            {/* overlay toolbar anchored to the board */}
            <div className="stage-toolbar">
              <button
                type="button"
                className={`icon-btn fs-btn${isFs ? " active" : ""}`}
                aria-label={
                  isFs ? "Exit fullscreen (Esc)" : "Enter fullscreen (F)"
                }
                onClick={toggleFs}
                title={isFs ? "Exit fullscreen (Esc)" : "Enter fullscreen (F)"} // optional tooltip
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
            />
          </div>
        </div>
      </main>

      {/* Controls block just under the fretboard */}
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
          setSelectedPreset={(name) => {
            setSelectedPreset(name);
            const arr = presetMap[name];
            if (Array.isArray(arr) && arr.length) setTuning(arr);
          }}
          savedExists={savedExists}
          handleSaveDefault={saveDefault}
          handleLoadSavedDefault={loadSavedDefault}
          handleResetFactoryDefault={resetFactoryDefault}
          systemId={systemId}
        />

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
          openOnlyInScale={openOnlyInScale}
          setOpenOnlyInScale={setOpenOnlyInScale}
          colorByDegree={colorByDegree}
          setColorByDegree={setColorByDegree}
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
