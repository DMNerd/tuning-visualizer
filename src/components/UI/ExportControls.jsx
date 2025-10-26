import React, { useMemo, useEffect } from "react";
import { dequal } from "dequal";
import clsx from "clsx";
import Section from "@/components/UI/Section";
import { toast } from "react-hot-toast";
import { useFilePicker } from "react-use";

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
  const [openFileSelector, { filesContent, errors, clear }] = useFilePicker({
    accept: ["application/json", ".json"],
    multiple: false,
    readAs: "Text",
  });

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

  const doExportCurrent = () => exportCurrent?.();

  const doExportAll = () => exportAll?.();

  useEffect(() => {
    if (!errors?.length) return;
    errors.forEach((error) => {
      toast.error(error?.message || "Import failed.");
    });
    clear();
  }, [errors, clear]);

  useEffect(() => {
    if (!filesContent?.length) return;
    const file = filesContent[0];

    let parsed;
    try {
      parsed = JSON.parse(file.content);
    } catch {
      toast.error("Selected file is not valid JSON.");
      clear();
      return;
    }

    const json = Array.isArray(parsed) ? parsed : [parsed];
    const maybePromise = importFromJson?.(json, [file.name]);
    if (maybePromise && typeof maybePromise.finally === "function") {
      maybePromise.finally(() => {
        clear();
      });
      return;
    }

    clear();
  }, [filesContent, importFromJson, clear]);

  return (
    <Section title="Export / Import">
      <div className={clsx("control-panel", "export-controls")}>
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
          <button type="button" className="btn" onClick={openFileSelector}>
            Import tunings (.json)
          </button>
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
