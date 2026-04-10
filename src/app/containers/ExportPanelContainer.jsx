import React from "react";
import { ErrorBoundary } from "react-error-boundary";

import ErrorFallback from "@/components/UI/ErrorFallback";
import ExportControls from "@/components/UI/controls/ExportControls";

export default function ExportPanelContainer({
  fileBase,
  boardRef,
  exporters,
  packActions,
  shareState,
}) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[fileBase]}>
      <ExportControls
        boardRef={boardRef}
        fileBase={fileBase}
        downloadPNG={exporters.downloadPNG}
        downloadSVG={exporters.downloadSVG}
        printFretboard={exporters.printFretboard}
        buildHeader={exporters.buildHeader}
        exportCurrent={exporters.exportCurrent}
        exportAll={exporters.exportAll}
        importFromJson={exporters.importFromJson}
        onClearCustom={packActions.clearAllPacks}
        onManageCustom={packActions.openManager}
        shareState={shareState}
      />
    </ErrorBoundary>
  );
}
