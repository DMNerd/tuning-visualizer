// src/components/UI/ExportControls.jsx
import { useState, useMemo, useRef } from "react";
import Section from "@/components/UI/Section";

export default function ExportControls({
  boardRef,
  fileBase,
  downloadPNG,
  downloadSVG,
  printFretboard,
  buildHeader,
  // required to wire correct EDO + strings for tuning export/import:
  getCurrentTuningPack, // () => TuningPack
  getAllCustomTunings, // () => TuningPack[]
  onImportTunings, // (packs: TuningPack[], filenames?: string[]) => void
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

  const downloadJSON = (dataObj, filename) => {
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

  const exportCurrentTuning = () => {
    if (typeof getCurrentTuningPack !== "function") {
      alert(
        "Export not wired: getCurrentTuningPack is missing. Pass it from useTuningIO / tuningIO.",
      );
      return;
    }
    try {
      const pack = getCurrentTuningPack();
      const safe = (pack.name || fileBase || "tuning").replace(
        /[^a-z0-9\-_]+/gi,
        "_",
      );
      downloadJSON(pack, `${safe}.tuning.json`);
    } catch (e) {
      alert(`Export failed: ${e?.message || e}`);
    }
  };

  const exportAllCustom = () => {
    if (typeof getAllCustomTunings !== "function") {
      alert(
        "Export not wired: getAllCustomTunings is missing. Pass it from useTuningIO.",
      );
      return;
    }
    try {
      const packs = getAllCustomTunings() || [];
      if (!packs.length) {
        alert("No custom tunings to export.");
        return;
      }
      downloadJSON(
        { version: 1, type: "tuning-bundle", items: packs },
        `tunings.bundle.json`,
      );
    } catch (e) {
      alert(`Export failed: ${e?.message || e}`);
    }
  };

  const onPickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (typeof onImportTunings !== "function") {
      alert(
        "Import not wired: onImportTunings is missing. Pass it from useTuningIO.",
      );
      return;
    }
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // Normalize into an array and let onImportTunings (Valibot) validate
      let packsArray;
      if (Array.isArray(json)) {
        packsArray = json;
      } else if (json?.items && Array.isArray(json.items)) {
        packsArray = json.items;
      } else {
        packsArray = [json];
      }

      onImportTunings(packsArray, [file.name]);
      e.target.value = "";
      alert(`Imported ${packsArray.length} tuning(s).`);
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

        {/* Tuning I/O */}
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
