// src/App.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import Fretboard from "@/components/Fretboard/Fretboard";

// exporters
import {
  downloadPNG,
  downloadSVG,
  printFretboard,
  slug,
} from "@/lib/export/exporters";

// theory
import { TUNINGS } from "@/lib/theory/tuning";
import { ALL_SCALES } from "@/lib/theory/scales";
import { DEFAULT_TUNINGS, PRESET_TUNINGS } from "@/lib/theory/constants";

// existing UI atoms
import Section from "@/components/UI/Section";
import PanelHeader from "@/components/UI/PanelHeader";
import TuningSystemSelector from "@/components/UI/TuningSystemSelector";
import ScaleControls from "@/components/UI/ScaleControls";
import DisplayControls from "@/components/UI/DisplayControls";
import InstrumentControls from "@/components/UI/InstrumentControls";
import ExportControls from "@/components/UI/ExportControls";

export default function App() {
  // choose your startup system here
  const [systemId, setSystemId] = useState("12-TET");
  const system = TUNINGS[systemId];

  // strings / frets
  const [strings, setStrings] = useState(6);
  const [frets, setFrets] = useState(22);

  // scale / root / accidental
  const [scale, setScale] = useState("Major (Ionian)");
  const [root, setRoot] = useState("C");
  const [accidental, setAccidental] = useState("sharp"); // "sharp" | "flat"

  // display options
  const [show, setShow] = useState("names");
  const [showOpen, setShowOpen] = useState(true);
  const [showFretNums, setShowFretNums] = useState(true);
  const [mirrorInlays, setMirrorInlays] = useState(false);
  const [dotSize, setDotSize] = useState(14);

  const [lefty, setLefty] = useState(false);
  const THEME_KEY = "fb.theme";

  const getInitialTheme = () => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light") return saved;
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return "dark";
      }
    } catch {
      // ignore storage errors
    }
    return "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  const boardRef = useRef(null);

  // ---------- User default tuning persistence (localStorage) ----------
  const lsKey = useMemo(
    () => `fb.defaultTuning.${systemId}.${strings}`,
    [systemId, strings],
  );

  const readSavedDefault = () => {
    try {
      const raw = localStorage.getItem(lsKey);
      if (!raw) return null;
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : null;
    } catch {
      return null;
    }
  };

  const saveCurrentAsDefault = (val) => {
    try {
      localStorage.setItem(lsKey, JSON.stringify(val));
    } catch {
      // ignore storage errors
    }
  };

  const clearSavedDefault = () => {
    try {
      localStorage.removeItem(lsKey);
    } catch {
      // ignore
    }
  };

  const hasSavedDefault = () => readSavedDefault() !== null;

  // ---------- Default resolution (user default → built-in → fallback) ----------
  const getDefaultTuning = (sysId, count) => {
    // 1) user-saved default (for sys+count)
    const key = `fb.defaultTuning.${sysId}.${count}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch {
      // ignore
    }

    // 2) built-in per-system default
    const sysDefaults = DEFAULT_TUNINGS?.[sysId] || {};
    if (sysDefaults[count]) return sysDefaults[count];

    // 3) built-in 12-TET fallback
    const twelve = DEFAULT_TUNINGS?.["12-TET"] || {};
    if (twelve[count]) return twelve[count];

    // 4) ultra-safe fallback (standard 6-string spelling)
    return ["E", "B", "G", "D", "A", "E"];
  };

  // tuning state, initialized per system + string count (using user default if present)
  const [tuning, setTuning] = useState(() =>
    getDefaultTuning(systemId, strings),
  );

  // ---------- Presets (named, per system + string count) ----------
  const presetMap = useMemo(() => {
    const bySys = PRESET_TUNINGS?.[systemId];
    const byCount = bySys?.[strings];
    // Always offer at least a factory default
    const factory = getDefaultTuning(systemId, strings);
    if (byCount && Object.keys(byCount).length) {
      return { "Factory default": factory, ...byCount };
    }
    return { "Factory default": factory };
  }, [systemId, strings]);

  const presetNames = useMemo(() => Object.keys(presetMap), [presetMap]);

  const [selectedPreset, setSelectedPreset] = useState("Factory default");
  useEffect(() => {
    // reset selection when system/strings change so UI reflects context
    setSelectedPreset("Factory default");
  }, [systemId, strings]);

  const applySelectedPreset = () => {
    const arr = presetMap[selectedPreset];
    if (Array.isArray(arr) && arr.length) setTuning(arr);
  };

  // names for active system (spelled with current accidental preference)
  const sysNames = useMemo(
    () =>
      Array.from({ length: system.divisions }, (_, pc) =>
        system.nameForPc(pc, accidental),
      ),
    [system, accidental],
  );

  // map any valid spelling (sharp or flat) to a pitch class
  const pcFromName = useMemo(() => {
    const map = new Map();
    for (let pc = 0; pc < system.divisions; pc++) {
      map.set(system.nameForPc(pc, "sharp"), pc);
      map.set(system.nameForPc(pc, "flat"), pc);
    }
    return (name) => {
      const v = map.get(name);
      return typeof v === "number" ? v : 0;
    };
  }, [system]);

  // root index from current root label
  const rootIx = useMemo(() => pcFromName(root), [root, pcFromName]);

  // scales for system
  const scaleOptions = useMemo(
    () => ALL_SCALES.filter((s) => s.systemId === system.id),
    [system.id],
  );

  // keep selected scale valid when changing system (12 <-> 24, etc.)
  useEffect(() => {
    const has = scaleOptions.find((s) => s.label === scale);
    if (!has && scaleOptions.length) setScale(scaleOptions[0].label);
  }, [system.id, scale, scaleOptions]);

  const intervals = useMemo(() => {
    const def = scaleOptions.find((s) => s.label === scale);
    return def?.pcs ?? (scaleOptions[0]?.pcs || []);
  }, [scale, scaleOptions]);

  const fileBase = useMemo(
    () => slug(root, scale, accidental, `${strings}str`),
    [root, scale, accidental, strings],
  );

  // theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  // When accidental preference changes, keep same PCs but respell root & tuning
  useEffect(() => {
    const toName = (pc) => system.nameForPc(pc, accidental);
    setRoot((prev) => toName(pcFromName(prev)));
    setTuning((prev) => prev.map((n) => toName(pcFromName(n))));
  }, [accidental, system, pcFromName]);

  // When temperament or string count change, adopt default (user → built-in)
  useEffect(() => {
    setTuning(getDefaultTuning(systemId, strings));
  }, [systemId, strings]);

  // When string count changes via UI
  const handleStringsChange = (s) => {
    setStrings(s);
    setTuning(getDefaultTuning(systemId, s));
  };

  // ---------- UI actions for defaults ----------
  const handleSaveDefault = () => {
    saveCurrentAsDefault(tuning);
  };

  const handleLoadSavedDefault = () => {
    const saved = readSavedDefault();
    if (saved) setTuning(saved);
  };

  const handleResetFactoryDefault = () => {
    clearSavedDefault();
    setTuning(getDefaultTuning(systemId, strings));
  };

  const savedExists = hasSavedDefault();

  return (
    <div className="layout">
      <div className="panel">
        <PanelHeader
          theme={theme}
          setTheme={setTheme}
          lefty={lefty}
          setLefty={setLefty}
        />

        {/* 1) Tunning */}
        <TuningSystemSelector
          systemId={systemId}
          setSystemId={setSystemId}
          systems={TUNINGS}
        />

        {/* 2) Scale */}
        <ScaleControls
          root={root}
          setRoot={setRoot}
          scale={scale}
          setScale={setScale}
          sysNames={sysNames}
          scaleOptions={scaleOptions}
        />

        {/* 3) Instrument */}
        <InstrumentControls
          strings={strings}
          setStrings={setStrings}
          frets={frets}
          setFrets={setFrets}
          sysNames={sysNames}
          tuning={tuning}
          setTuning={setTuning}
          handleStringsChange={handleStringsChange}
          presetNames={presetNames}
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          applySelectedPreset={applySelectedPreset}
          savedExists={savedExists}
          handleSaveDefault={handleSaveDefault}
          handleLoadSavedDefault={handleLoadSavedDefault}
          handleResetFactoryDefault={handleResetFactoryDefault}
          systemId={systemId}
        />

        {/* 4) Display (includes Accidentals + Inlays) */}
        <DisplayControls
          /* labels & visibility */
          show={show}
          setShow={setShow}
          showOpen={showOpen}
          setShowOpen={setShowOpen}
          showFretNums={showFretNums}
          setShowFretNums={setShowFretNums}
          dotSize={dotSize}
          setDotSize={setDotSize}
          /* inlays (merged) */
          mirrorInlays={mirrorInlays}
          setMirrorInlays={setMirrorInlays}
          /* accidentals (merged) */
          accidental={accidental}
          setAccidental={setAccidental}
        />

        {/* 5) Export */}
        <ExportControls
          boardRef={boardRef}
          fileBase={fileBase}
          downloadPNG={downloadPNG}
          downloadSVG={downloadSVG}
          printFretboard={printFretboard}
        />
      </div>

      <div className="stage">
        <div className={`fretboard-wrap ${lefty ? "lefty" : ""}`}>
          <Fretboard
            ref={boardRef}
            strings={strings}
            frets={frets}
            tuning={tuning}
            rootIx={rootIx}
            intervals={intervals}
            accidental={accidental}
            show={show}
            showOpen={showOpen}
            mirrorInlays={mirrorInlays}
            showFretNums={showFretNums}
            dotSize={dotSize}
            lefty={lefty}
            system={system}
          />
        </div>
      </div>
    </div>
  );
}
