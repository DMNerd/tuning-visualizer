import { useRef, useMemo, useState } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import Section from "@shared/ui/Section";
import { withToastPromise } from "@shared/lib/toast";
import { memoWithKeys } from "@shared/lib/memo";
import {
  PNG_EXPORT_SCALE,
  EXPORT_PADDING,
} from "@features/export/model/svgExport";
import {
  getImportPipelineErrorMessage,
  IMPORT_PIPELINE_ERROR_CODES,
  runImportFilePipeline,
} from "@features/export/model/importPipeline";
import { ShareConfigModal } from "@features/share";

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
  onManageCustom,
  shareState,
}) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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
        loading: t("export.pngLoading"),
        success: t("export.pngSuccess"),
        error: t("export.pngError"),
      },
      "export-png",
    );

  const doDownloadSVG = () =>
    withToastPromise(
      () => downloadSVG?.(boardRef?.current, safeFileBase, buildHeader?.()),
      {
        loading: t("export.svgLoading"),
        success: t("export.svgSuccess"),
        error: t("export.svgError"),
      },
      "export-svg",
    );

  const doPrint = () =>
    withToastPromise(
      () => printFretboard?.(boardRef?.current, buildHeader?.()),
      {
        loading: t("export.printLoading"),
        success: t("export.printSuccess"),
        error: t("export.printError"),
      },
      "export-print",
    );

  const doExportCurrent = () => exportCurrent?.();
  const doExportAll = () => exportAll?.();
  const doManageCustom = () => onManageCustom?.();
  const doOpenShareModal = () => setIsShareModalOpen(true);
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
    <Section id="export-controls" title={t("export.title")}>
      <div className={clsx("tv-controls", "tv-controls--export")}>
        <div className="tv-controls__grid--two">
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={doDownloadPNG}
          >
            {t("export.png")}
          </button>
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={doDownloadSVG}
          >
            {t("export.svg")}
          </button>
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={doPrint}
          >
            {t("export.print")}
          </button>
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={doExportCurrent}
          >
            {t("export.current")}
          </button>
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={doExportAll}
          >
            {t("export.all")}
          </button>
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={doManageCustom}
            disabled={!onManageCustom}
          >
            {t("export.manage")}
          </button>
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={triggerImport}
          >
            {t("export.import")}
          </button>
          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={doOpenShareModal}
            disabled={!shareState}
          >
            {t("export.quickshare")}
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
      <ShareConfigModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        appShareState={shareState}
      />
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
  "onManageCustom",
  "shareState",
]);

export default ExportControlsMemo;
