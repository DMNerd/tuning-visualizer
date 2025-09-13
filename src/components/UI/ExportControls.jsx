// src/components/UI/ExportControls.jsx
import { useState, useMemo, useRef } from "react";
import Section from "@/components/UI/Section";
import { makeTuningPack, parseTuningPack } from "@/lib/export/tuningIO";

export default function ExportControls({
  boardRef,
  fileBase,
  downloadPNG,
  downloadSVG,
  printFretboard,
  buildHeader,
  getCurrentTuningPack,
  getAllCustomTunings,
  onImportTunings,
}) {
  const [includeHeader, setIncludeHeader] = useState(true);
  const fileInputRef = useRef(null);

  const header = useMemo(() => {
    if (!includeHeader || !buildHeader) return null;
    try {
      return buildHeader();
    } catch {
      return null;
    }
  }, [includeHeader, buildHeader]);

  // ───────── helpers ─────────
  const download = (dataObj, filename) => {
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ───────── tuning export ─────────
  const exportCurrentTuning = () => {
    try {
      const pack =
        getCurrentTuningPack?.() ??
        makeTuningPack({
          name: fileBase || "tuning",
          edo: 12,
          strings: [],
        });
      const safe = (pack.name || "tuning").replace(/[^a-z0-9\-_]+/gi, "_");
      download(pack, `${safe}.tuning.json`);
    } catch (e) {
      alert(`Export failed: ${e?.message || e}`);
    }
  };

  const exportAllCustom = () => {
    try {
      const packs = getAllCustomTunings?.() || [];
      if (!packs.length) throw new Error("No custom tunings to export.");
      download(
        { version: 1, type: "tuning-bundle", items: packs },
        `tunings.bundle.json`,
      );
    } catch (e) {
      alert(`Export failed: ${e?.message || e}`);
    }
  };

  // ───────── tuning import ─────────
  const onPickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      let packs = [];
      if (Array.isArray(json)) {
        packs = json.map(parseTuningPack);
      } else if (json?.items && Array.isArray(json.items)) {
        packs = json.items.map(parseTuningPack);
      } else {
        packs = [parseTuningPack(json)];
      }

      onImportTunings?.(packs);
      e.target.value = "";
      alert(`Imported ${packs.length} tuning(s).`);
    } catch (err) {
      console.error(err);
      alert(`Import failed: ${err?.message || err}`);
    }
  };

  return (
    <Section title="Export">
      <div className="field" style={{ marginBottom: 12 }}>
        <label htmlFor="include-header" className="check">
          <input
            id="include-header"
            type="checkbox"
            checked={includeHeader}
            onChange={(e) => setIncludeHeader(e.target.checked)}
          />
          <span>Include info header</span>
        </label>
      </div>

      <div className="btn-row">
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

        {/* ── Tuning I/O ───────────────────────────── */}
        <button className="btn" onClick={exportCurrentTuning}>
          Export current tuning (.tuning.json)
        </button>

        <button className="btn" onClick={exportAllCustom}>
          Export all custom (bundle)
        </button>

        <button className="btn" onClick={onPickFile}>
          Import tuning(s)…
        </button>
        <input
          ref={fileInputRef}
          onChange={handleFileChange}
          type="file"
          accept=".json,.tuning.json,application/json"
          style={{ display: "none" }}
        />
      </div>
    </Section>
  );
}
