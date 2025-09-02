// src/components/UI/ExportControls.jsx
import { useState, useMemo } from "react";
import Section from "@/components/UI/Section";

export default function ExportControls({
  boardRef,
  fileBase,
  downloadPNG,
  downloadSVG,
  printFretboard,
  buildHeader,
}) {
  const [includeHeader, setIncludeHeader] = useState(false);

  const header = useMemo(() => {
    if (!includeHeader || !buildHeader) return null;
    try {
      return buildHeader();
    } catch {
      return null;
    }
  }, [includeHeader, buildHeader]);

  return (
    <Section title="Export">
      <div className="field" style={{ marginBottom: 12 }}>
        <label htmlFor="include-header" className="checkbox">
          <input
            id="include-header"
            type="checkbox"
            checked={includeHeader}
            onChange={(e) => setIncludeHeader(e.target.checked)}
          />
          <span style={{ marginLeft: 8 }}>Include info header</span>
        </label>
      </div>

      <button
        className="btn"
        onClick={() =>
          boardRef.current &&
          downloadPNG(boardRef.current, `${fileBase}.png`, 3, 16, header)
        }
      >
        Export PNG
      </button>

      <button
        className="btn"
        onClick={() =>
          boardRef.current &&
          downloadSVG(boardRef.current, `${fileBase}.svg`, header, 16)
        }
      >
        Export SVG
      </button>

      <button
        className="btn"
        onClick={() =>
          boardRef.current && printFretboard(boardRef.current, header, 16)
        }
      >
        Print
      </button>
    </Section>
  );
}
