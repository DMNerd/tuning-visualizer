import React, { useState, useRef, useEffect } from "react";
import Fretboard from "@/components/Fretboard";
import Section from "@/components/UI/Section";
import { NOTES_SHARP, SCALES, DEFAULT_TUNINGS } from "@/lib/theory/constants";
import { noteIndex, namesFor } from "@/lib/theory/utils";
import { downloadPNG, downloadSVG, printFretboard, slug } from "@/lib/export/exporters";

export default function App() {
  // ✅ must match constants.js keys
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

  const rootIx = noteIndex(root, accidental);
  const intervals = Array.isArray(SCALES[scale]) ? SCALES[scale] : SCALES["Major (Ionian)"];

  const names = namesFor(accidental);
  const fileBase = slug(root, scale, accidental, `${strings}str`);

  // ✅ apply theme to document body
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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

        <Section title="Scale">
          <div className="grid2">
            <div className="field">
              <span>Root</span>
              <select value={root} onChange={(e) => setRoot(e.target.value)}>
                {NOTES_SHARP.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <span>Scale</span>
              <select value={scale} onChange={(e) => setScale(e.target.value)}>
                {Object.keys(SCALES).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <span>Accidental</span>
              <select
                value={accidental}
                onChange={(e) => setAccidental(e.target.value)}
              >
                <option value="sharp">♯ (sharps)</option>
                <option value="flat">♭ (flats)</option>
              </select>
            </div>
          </div>
        </Section>

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
          <label className="check">
            <input
              type="checkbox"
              checked={mirrorInlays}
              onChange={(e) => setMirrorInlays(e.target.checked)}
            />{" "}
            Mirror inlays
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

        <Section title="Instrument">
          <div className="grid2">
            <div className="field">
              <span>Strings</span>
              <input
                type="number"
                min="4"
                max="8"
                value={strings}
                onChange={(e) => {
                  const s = parseInt(e.target.value);
                  setStrings(s);
                  setTuning(DEFAULT_TUNINGS[s] || DEFAULT_TUNINGS[6]);
                }}
              />
            </div>
            <div className="field">
              <span>Frets</span>
              <input
                type="number"
                min="12"
                max="24"
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
                  {names.map((n) => (
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
            onClick={() => downloadPNG(boardRef.current, `${fileBase}.png`)}
          >
            Export PNG
          </button>
          <button
            className="btn"
            onClick={() => downloadSVG(boardRef.current, `${fileBase}.svg`)}
          >
            Export SVG
          </button>
          <button
            className="btn"
            onClick={() => printFretboard(boardRef.current)}
          >
            Print
          </button>
        </Section>
      </div>

      <div className="stage">
        <div className={`fretboard-wrap ${lefty ? "lefty" : ""}`}>
          <Fretboard
            ref={boardRef}  // ✅ ref now points to <svg>
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
          />
        </div>
      </div>
    </div>
  );
}
