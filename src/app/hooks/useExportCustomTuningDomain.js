import { useCallback, useMemo } from "react";
import { slug } from "@/lib/export/scales";
import { PANEL_CONTRACTS } from "@/app/contracts/panelContracts";
import { buildExportCustomTuningDomainReturn } from "@/app/hooks/domainReturnBuilders";

export function useExportCustomTuningDomain({
  boardRef,
  tunings,
  themeMode,
  root,
  scale,
  accidental,
  noteNaming = "english",
  strings,
  systemId,
  tuning,
  stringMeta,
  boardMeta,
  showChord,
  chordRoot,
  chordType,
  customTunings,
  customPackEditor,
  exporters,
}) {
  const fileBase = useMemo(
    () => slug(root, scale, accidental, `${strings}str`),
    [root, scale, accidental, strings],
  );

  const buildHeader = useCallback(
    () => ({
      system: systemId,
      tuning,
      scale,
      spelling: noteNaming === "german" ? "DE H/B" : "Intl B",
      accidental,
      strings,
      chordEnabled: showChord,
      chordRoot,
      chordType,
    }),
    [
      systemId,
      tuning,
      scale,
      noteNaming,
      accidental,
      strings,
      showChord,
      chordRoot,
      chordType,
    ],
  );

  const { clearAllPacks, openManager } = customPackEditor;
  const packActions = useMemo(
    () => ({
      clearAllPacks,
      openManager,
    }),
    [clearAllPacks, openManager],
  );

  const { downloadPNG, downloadSVG, printFretboard } = exporters;
  const { exportCurrent, exportAll, importFromJson } = customTunings;
  const exportPanel = useMemo(
    () => ({
      contract: PANEL_CONTRACTS.export,
      fileBase,
      boardRef,
      exporters: {
        downloadPNG,
        downloadSVG,
        printFretboard,
        buildHeader,
        exportCurrent: () => exportCurrent(tuning, stringMeta, boardMeta),
        exportAll,
        importFromJson,
      },
      packActions,
    }),
    [
      fileBase,
      boardRef,
      downloadPNG,
      downloadSVG,
      printFretboard,
      buildHeader,
      exportCurrent,
      exportAll,
      importFromJson,
      tuning,
      stringMeta,
      boardMeta,
      packActions,
    ],
  );

  const {
    editorState,
    isManagerOpen,
    cancelEditor,
    submitEditor,
    closeManager,
    editFromManager,
    deletePack,
  } = customPackEditor;
  const customTuningPacks = customTunings.customTunings;
  const modalPanel = useMemo(
    () => ({
      contract: PANEL_CONTRACTS.customTuningModals,
      modal: {
        editorState,
        isManagerOpen,
      },
      customTunings: customTuningPacks,
      systems: tunings,
      themeMode,
      handlers: {
        cancelEditor,
        submitEditor,
        closeManager,
        editFromManager,
        deletePack,
      },
    }),
    [
      editorState,
      isManagerOpen,
      customTuningPacks,
      tunings,
      themeMode,
      cancelEditor,
      submitEditor,
      closeManager,
      editFromManager,
      deletePack,
    ],
  );

  return buildExportCustomTuningDomainReturn({
    fileBase,
    exportPanel,
    modalPanel,
    packActions,
  });
}
