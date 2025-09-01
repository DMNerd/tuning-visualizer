import React, { useState, useRef, useEffect, useMemo } from "react";
import Fretboard from "@/components/Fretboard/Fretboard";
import Section from "@/components/UI/Section";

import {
  downloadPNG,
  downloadSVG,
  printFretboard,
  slug,
} from "@/lib/export/exporters";

// generalized theory
import { TUNINGS } from "@/lib/theory/tuning";
import { ALL_SCALES } from "@/lib/theory/scales";

// per-system defaults + (optional) named presets
import { DEFAULT_TUNINGS, PRESET_TUNINGS } from "@/lib/theory/constants";

// split UI controls
import AccidentalControls from "@/components/UI/AccidentalControls";
import InlayControls from "@/components/UI/InlayControls";

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
        <div className="panel-header">
          <h1>TunningViz</h1>
          <div className="toggles">
            <label className="switch" htmlFor="darkMode">
              <input
                id="darkMode"
                name="darkMode"
                type="checkbox"
                checked={theme === "dark"}
                onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
              />
              Dark Mode
            </label>
            <label className="switch" htmlFor="lefty">
              <input
                id="lefty"
                name="lefty"
                type="checkbox"
                checked={lefty}
                onChange={(e) => setLefty(e.target.checked)}
              />
              Lefty
            </label>
          </div>
        </div>

        {/* Tuning system selector */}
        <Section title="Tuning System">
          <div className="field">
            <span>System</span>
            <select
              id="system"
              name="system"
              value={systemId}
              onChange={(e) => setSystemId(e.target.value)}
            >
              {Object.keys(TUNINGS).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
        </Section>

        <Section title="Scale">
          <div className="grid2">
            <div className="field">
              <span>Root</span>
              <select
                id="root"
                name="root"
                value={root}
                onChange={(e) => setRoot(e.target.value)}
              >
                {sysNames.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <span>Scale</span>
              <select
                id="scale"
                name="scale"
                value={scale}
                onChange={(e) => setScale(e.target.value)}
              >
                {scaleOptions.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* Accidentals */}
        <AccidentalControls value={accidental} onChange={setAccidental} />

        <Section title="Display">
          <div className="field">
            <span>Labels</span>
            <select
              id="labels"
              name="labels"
              value={show}
              onChange={(e) => setShow(e.target.value)}
            >
              <option value="names">Note names</option>
              <option value="degrees">Degrees</option>
              <option value="off">Off</option>
            </select>
          </div>
          <label className="check" htmlFor="showOpen">
            <input
              id="showOpen"
              name="showOpen"
              type="checkbox"
              checked={showOpen}
              onChange={(e) => setShowOpen(e.target.checked)}
            />{" "}
            Show open notes
          </label>
          <label className="check" htmlFor="showFretNums">
            <input
              id="showFretNums"
              name="showFretNums"
              type="checkbox"
              checked={showFretNums}
              onChange={(e) => setShowFretNums(e.target.checked)}
            />{" "}
            Show fret numbers
          </label>
          <div className="field">
            <span>Dot size</span>
            <input
              id="dotSize"
              name="dotSize"
              type="range"
              min="8"
              max="24"
              value={dotSize}
              onChange={(e) => setDotSize(parseInt(e.target.value))}
            />
          </div>
        </Section>

        {/* Inlays */}
        <InlayControls
          mirrorInlays={mirrorInlays}
          onMirrorChange={setMirrorInlays}
        />

        {/* Instrument */}
        <Section title="Instrument">
          <div className="instrument">
            {/* Strings / Frets row */}
            <div className="row-2">
              <div className="field">
                <span>Strings</span>
                <input
                  id="strings"
                  name="strings"
                  type="number"
                  min="4"
                  max="8"
                  value={strings}
                  onChange={(e) =>
                    handleStringsChange(parseInt(e.target.value))
                  }
                />
              </div>
              <div className="field">
                <span>Frets</span>
                <input
                  id="frets"
                  name="frets"
                  type="number"
                  min="12"
                  max="30"
                  value={frets}
                  onChange={(e) => setFrets(parseInt(e.target.value))}
                />
              </div>
            </div>

            {/* Per-string selectors */}
            <div className="strings-grid">
              {tuning.map((note, i) => {
                const stringNum = strings - i;
                return (
                  <div key={i} className="field">
                    <span>String {stringNum}</span>
                    <select
                      id={`string-${stringNum}`}
                      name={`string-${stringNum}`}
                      value={note}
                      onChange={(e) => {
                        const copy = [...tuning];
                        copy[i] = e.target.value;
                        setTuning(copy);
                      }}
                    >
                      {sysNames.map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Presets picker */}
            <div className="field" style={{ marginTop: 8 }}>
              <span>Preset</span>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <select
                  id="preset"
                  name="preset"
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                >
                  {presetNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <button className="btn" onClick={applySelectedPreset}>
                  Apply preset
                </button>
              </div>
            </div>

            {/* Defaults UI */}
            <div
              className="defaults-row"
              style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
            >
              <button className="btn" onClick={handleSaveDefault}>
                Save as default ({systemId}, {strings}-string)
              </button>
              <button
                className="btn"
                onClick={handleLoadSavedDefault}
                disabled={!savedExists}
                title={
                  savedExists ? "" : "No saved default for this system/count"
                }
              >
                Load saved
              </button>
              <button className="btn" onClick={handleResetFactoryDefault}>
                Reset to factory default
              </button>
            </div>
          </div>
        </Section>

        <Section title="Export">
          <button
            className="btn"
            onClick={() =>
              boardRef.current &&
              downloadPNG(boardRef.current, `${fileBase}.png`)
            }
          >
            Export PNG
          </button>
          <button
            className="btn"
            onClick={() =>
              boardRef.current &&
              downloadSVG(boardRef.current, `${fileBase}.svg`)
            }
          >
            Export SVG
          </button>
          <button
            className="btn"
            onClick={() => boardRef.current && printFretboard(boardRef.current)}
          >
            Print
          </button>
        </Section>
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