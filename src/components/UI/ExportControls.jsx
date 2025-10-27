import { useRef, useMemo } from "react";
import clsx from "clsx";
import Section from "@/components/UI/Section";
import { withToastPromise } from "@/utils/toast";
import { memoWithPick } from "@/utils/memo";

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

  const doExportCurrent = () => exportCurrent?.();
  const doExportAll = () => exportAll?.();
  const triggerImport = () => fileInputRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let text;
    try {
      text = await file.text();
    } catch (err) {
      console.error(err);
      e.target.value = "";
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.error("Selected file is not valid JSON.");
      e.target.value = "";
      return;
    }

    const json = Array.isArray(parsed) ? parsed : [parsed];
    const maybePromise = importFromJson?.(json, [file.name]);
    if (maybePromise && typeof maybePromise.finally === "function") {
      return maybePromise.finally(() => {
        e.target.value = "";
      });
    }

    e.target.value = "";
    return maybePromise;
  };

  return (
    <Section title="Export / Import">
      <div className={clsx("tv-controls", "tv-controls--export")}>
        <div className="tv-controls__grid--two">
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={doDownloadPNG}
          >
            Export PNG
          </button>
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={doDownloadSVG}
          >
            Export SVG
          </button>
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={doPrint}
          >
            Print
          </button>
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={doExportCurrent}
          >
            Export current tuning (.json)
          </button>
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={doExportAll}
          >
            Export all custom (.json)
          </button>
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={triggerImport}
          >
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

const ExportControlsMemo = memoWithPick(ExportControls, pick);

export default ExportControlsMemo;
