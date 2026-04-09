import { useRef, useMemo } from "react";
import clsx from "clsx";
import { toast } from "react-hot-toast";
import Section from "@/components/UI/Section";
import { withToastPromise } from "@/utils/toast";
import { memoWithKeys } from "@/utils/memo";
import { PNG_EXPORT_SCALE, EXPORT_PADDING } from "@/lib/export/scales";
import {
  getImportPipelineErrorMessage,
  IMPORT_PIPELINE_ERROR_CODES,
  runImportFilePipeline,
} from "@/lib/export/importPipeline";

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
  onClearCustom,
  onManageCustom,
}) {
  const fileInputRef = useRef(null);
  const safeFileBase = useMemo(() => fileBase || "fretboard", [fileBase]);

  const doDownloadPNG = () =>
    withToastPromise(
      () =>
        downloadPNG?.(
          boardRef?.current,
          safeFileBase,
          PNG_EXPORT_SCALE,
          EXPORT_PADDING,
          buildHeader?.(),
        ),
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
  const doClearCustom = () => onClearCustom?.();
  const doManageCustom = () => onManageCustom?.();
  const triggerImport = () => fileInputRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    const result = await runImportFilePipeline({
      file,
      importFromJson,
    });

    if (!result.ok) {
      const toastMessage = getImportPipelineErrorMessage(result.error);

      switch (result.error.code) {
        case IMPORT_PIPELINE_ERROR_CODES.INVALID_FILE_TYPE:
        case IMPORT_PIPELINE_ERROR_CODES.FILE_TOO_LARGE:
        case IMPORT_PIPELINE_ERROR_CODES.NO_FILE:
        case IMPORT_PIPELINE_ERROR_CODES.FILE_READ_FAILED:
        case IMPORT_PIPELINE_ERROR_CODES.INVALID_JSON:
          toast.error(toastMessage, { id: "import-tunings" });
          break;
        case IMPORT_PIPELINE_ERROR_CODES.IMPORT_FAILED:
        default:
          break;
      }

      if (result.error.cause) {
        console.error(result.error.cause);
      }
    }

    e.target.value = "";
    return result;
  };

  return (
    <Section id="export-controls" title="Export / Import">
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
            onClick={doManageCustom}
            disabled={!onManageCustom}
          >
            Manage custom tunings
          </button>
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={doClearCustom}
            disabled={!onClearCustom}
          >
            Clear custom tunings
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

// React Profiler note: export controls are callback/ref heavy and do not depend
// on deep nested structures; top-level key checks avoid `dequal` cost.
const ExportControlsMemo = memoWithKeys(ExportControls, [
  "boardRef",
  "fileBase",
  "downloadPNG",
  "downloadSVG",
  "printFretboard",
  "buildHeader",
  "exportCurrent",
  "exportAll",
  "importFromJson",
  "onClearCustom",
  "onManageCustom",
]);

export default ExportControlsMemo;
