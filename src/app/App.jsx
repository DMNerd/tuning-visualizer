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

// preset tunings (your existing)
import { DEFAULT_TUNINGS } from "@/lib/theory/constants";

// split UI controls
import AccidentalControls from "@/components/UI/AccidentalControls";
import InlayControls from "@/components/UI/InlayControls";

export default function App() {
  // default to 24-TET (flexible)
  const [systemId, setSystemId] = useState("12-TET");
  const system = TUNINGS[systemId];

  // existing UI state
  const [scale, setScale] = useState("Major (Ionian)");
  const [root, setRoot] = useState("C");
  const [accidental, setAccidental] = useState("sharp");

  const [show, setShow] = useState("names");
  const [showOpen, setShowOpen] = useState(true);
  const [showFretNums, setShowFretNums] = useState(true);
  const [mirrorInlays, setMirrorInlays] = useState(false);
  const [dotSize, setDotSize] = useState(14);

  const [strings, setStrings] = useState(6);
  const [frets, setFrets] = useState(22);
  const [tuning, setTuning] = useState(DEFAULT_TUNINGS[6]);

  const [lefty, setLefty] = useState(false);
  const [theme, setTheme] = useState("light");

  const boardRef = useRef(null);

  // names for active system
  const sysNames = useMemo(
    () =>
      Array.from({ length: system.divisions }, (_, pc) => system.nameForPc(pc)),
    [system],
  );

  // root index
  const rootIx = useMemo(() => {
    const ix = sysNames.indexOf(root);
    return ix >= 0 ? ix : 0;
  }, [root, sysNames]);

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
  }, [theme]);

  const handleStringsChange = (s) => {
    setStrings(s);
    setTuning(DEFAULT_TUNINGS[s] || DEFAULT_TUNINGS[6]);
  };

  return (
    <div className="layout">
      <div className="panel">
        <div className="panel-header">
          <h1>Fretboard Visualizer</h1>
          <div className="toggles">
            <label className="switch">
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
              />
              Dark
            </label>
            <label className="switch">
              <input
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
              <select value={root} onChange={(e) => setRoot(e.target.value)}>
                {sysNames.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <span>Scale</span>
              <select value={scale} onChange={(e) => setScale(e.target.value)}>
                {scaleOptions.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* Split out: Accidentals */}
        <AccidentalControls value={accidental} onChange={setAccidental} />

        <Section title="Display">
          <div className="field">
            <span>Labels</span>
            <select value={show} onChange={(e) => setShow(e.target.value)}>
              <option value="names">Note names</option>
              <option value="degrees">Degrees</option>
              <option value="off">Off</option>
            </select>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={showOpen}
              onChange={(e) => setShowOpen(e.target.checked)}
            />{" "}
            Show open notes
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={showFretNums}
              onChange={(e) => setShowFretNums(e.target.checked)}
            />{" "}
            Show fret numbers
          </label>
          <div className="field">
            <span>Dot size</span>
            <input
              type="range"
              min="8"
              max="24"
              value={dotSize}
              onChange={(e) => setDotSize(parseInt(e.target.value))}
            />
          </div>
        </Section>

        {/* Split out: Inlays */}
        <InlayControls
          mirrorInlays={mirrorInlays}
          onMirrorChange={setMirrorInlays}
        />

        <Section title="Instrument">
          <div className="grid2">
            <div className="field">
              <span>Strings</span>
              <input
                type="number"
                min="4"
                max="8"
                value={strings}
                onChange={(e) => handleStringsChange(parseInt(e.target.value))}
              />
            </div>
            <div className="field">
              <span>Frets</span>
              <input
                type="number"
                min="12"
                max="30"
                value={frets}
                onChange={(e) => setFrets(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="tuning-grid">
            {tuning.map((note, i) => (
              <div key={i} className="field">
                <span>String {strings - i}</span>
                <select
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
            ))}
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
