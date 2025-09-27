import React, { useState, useMemo, useRef } from "react";
import { dequal } from "dequal";
import Section from "@/components/UI/Section";
import { toast } from "react-hot-toast";

function ExportControls({
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
      toast.error(
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
      toast.success(`Exported "${pack.name || safe}" tuning.`);
    } catch (e) {
      toast.error(`Export failed: ${e?.message || e}`);
    }
  };

  const exportAllCustom = () => {
    if (typeof getAllCustomTunings !== "function") {
      toast.error(
        "Export not wired: getAllCustomTunings is missing. Pass it from useTuningIO.",
      );
      return;
    }
    try {
      const packs = getAllCustomTunings() || [];
      if (!packs.length) {
        toast("No custom tunings to export.", { icon: "ℹ️" });
        return;
      }
      downloadJSON(
        { version: 1, type: "tuning-bundle", items: packs },
        `tunings.bundle.json`,
      );
      toast.success(`Exported ${packs.length} custom tuning(s).`);
    } catch (e) {
      toast.error(`Export failed: ${e?.message || e}`);
    }
  };

  const onPickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (typeof onImportTunings !== "function") {
      toast.error(
        "Import not wired: onImportTunings is missing. Pass it from useTuningIO.",
      );
      return;
    }
    try {
      const text = await file.text();
      const json = JSON.parse(text);

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
      toast.success(`Imported ${packsArray.length} tuning(s).`);
    } catch (err) {
      console.error(err);
      toast.error(`Import failed: ${err?.message || err}`);
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

function pick(p) {
  return {
    boardRef: !!p.boardRef,
    fileBase: p.fileBase,
    downloadPNG: p.downloadPNG,
    downloadSVG: p.downloadSVG,
    printFretboard: p.printFretboard,
    buildHeader: p.buildHeader,
    getCurrentTuningPack: p.getCurrentTuningPack,
    getAllCustomTunings: p.getAllCustomTunings,
    onImportTunings: p.onImportTunings,
  };
}
export default React.memo(ExportControls, (a, b) => dequal(pick(a), pick(b)));
