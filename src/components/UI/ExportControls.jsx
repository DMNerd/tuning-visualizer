import React, { useRef, useMemo } from "react";
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
  exportCurrent,
  exportAll,
  importFromJson,
}) {
  const fileInputRef = useRef(null);

  const safeFileBase = useMemo(() => fileBase || "fretboard", [fileBase]);

  const withToastPromise = (op, { loading, success, error }, id) =>
    toast.promise(
      Promise.resolve().then(op),
      { loading, success, error },
      id ? { id } : undefined,
    );

  const doDownloadPNG = () =>
    withToastPromise(
      () =>
        downloadPNG?.(boardRef?.current, safeFileBase, 3, 16, buildHeader?.()),
      {
        loading: "Rendering PNG…",
        success: "PNG saved.",
        error: "PNG export failed.",
      },
      "export-png",
    );

  const doDownloadSVG = () =>
    withToastPromise(
      () => downloadSVG?.(boardRef?.current, safeFileBase, buildHeader?.()),
      {
        loading: "Rendering SVG…",
        success: "SVG saved.",
        error: "SVG export failed.",
      },
      "export-svg",
    );

  const doPrint = () =>
    withToastPromise(
      () => printFretboard?.(boardRef?.current, buildHeader?.()),
      {
        loading: "Opening print dialog…",
        success: "Print dialog opened.",
        error: "Print failed.",
      },
      "export-print",
    );

  const doExportCurrent = () =>
    withToastPromise(
      () => exportCurrent?.(),
      {
        loading: "Preparing current tuning…",
        success: "Current tuning exported.",
        error: "Export failed.",
      },
      "export-current-tuning",
    );

  const doExportAll = () =>
    withToastPromise(
      () => exportAll?.(),
      {
        loading: "Collecting custom tunings…",
        success: "Custom tunings exported.",
        error: "Export failed.",
      },
      "export-all-tunings",
    );

  const triggerImport = () => fileInputRef.current?.click();

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    withToastPromise(
      async () => {
        const text = await file.text();
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error("Selected file is not valid JSON.");
        }
        const json = Array.isArray(parsed) ? parsed : [parsed];
        await importFromJson?.(json, [file.name]);
        e.target.value = "";
      },
      {
        loading: `Importing “${file.name}”…`,
        success: "Tunings imported.",
        error: (err) => err?.message || "Import failed.",
      },
      "import-tunings",
    );
  };

  return (
    <Section title="Export / Import">
      <div className="control-panel export-controls">
        <div className="row">
          <button type="button" className="btn" onClick={doDownloadPNG}>
            Export PNG
          </button>
          <button type="button" className="btn" onClick={doDownloadSVG}>
            Export SVG
          </button>
          <button type="button" className="btn" onClick={doPrint}>
            Print
          </button>
          <button type="button" className="btn" onClick={doExportCurrent}>
            Export current tuning (.json)
          </button>
          <button type="button" className="btn" onClick={doExportAll}>
            Export all custom (.json)
          </button>
          <button type="button" className="btn" onClick={triggerImport}>
            Import tunings (.json)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={onFileChange}
            hidden
          />
        </div>
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
    exportCurrent: p.exportCurrent,
    exportAll: p.exportAll,
    importFromJson: p.importFromJson,
  };
}

export default React.memo(ExportControls, (a, b) => dequal(pick(a), pick(b)));
