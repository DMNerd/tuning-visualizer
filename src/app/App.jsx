import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import clsx from "clsx";
import { ErrorBoundary } from "react-error-boundary";
import {
  FiMaximize,
  FiMinimize,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
  FiLoader,
} from "react-icons/fi";
import { Toaster, ToastBar, toast } from "react-hot-toast";

// exporters
import {
  downloadPNG,
  downloadSVG,
  printFretboard,
  slug,
} from "@/lib/export/scales";

// fretboard
import Fretboard from "@/components/Fretboard/Fretboard";

// cheatsheet
import HotkeysCheatsheet from "@/components/UI/HotkeysCheatsheet";

// theory
import { TUNINGS } from "@/lib/theory/tuning";
import { ALL_SCALES } from "@/lib/theory/scales";
import { PRESET_TUNING_META } from "@/lib/presets/presets";

import {
  STR_MIN,
  STR_MAX,
  FRETS_MIN,
  FRETS_MAX,
  STR_FACTORY,
  getFactoryFrets,
  SYSTEM_DEFAULT,
  ROOT_DEFAULT,
  CAPO_DEFAULT,
  DISPLAY_DEFAULTS,
  SCALE_DEFAULT,
} from "@/lib/config/appDefaults";

import { DEFAULT_TUNINGS, PRESET_TUNINGS } from "@/lib/presets/presetState";

// existing UI atoms
import PanelHeader from "@/components/UI/PanelHeader";
import TuningSystemSelector from "@/components/UI/TuningSystemSelector";
import ScaleControls from "@/components/UI/ScaleControls";
import DisplayControls from "@/components/UI/DisplayControls";
import InstrumentControls from "@/components/UI/InstrumentControls";
import ExportControls from "@/components/UI/ExportControls";
import ChordBuilder from "@/components/UI/ChordBuilder";
import ErrorFallback from "@/components/UI/ErrorFallback";
const TuningPackEditorModal = React.lazy(
  () => import("@/components/UI/TuningPackEditorModal"),
);
const TuningPackManagerModal = React.lazy(
  () => import("@/components/UI/TuningPackManagerModal"),
);

// hooks
import { useTheme } from "@/hooks/useTheme";
import { useScaleOptions } from "@/hooks/useScaleOptions";
import { useDrawFrets } from "@/hooks/useDrawFrets";
import { useDefaultTuning } from "@/hooks/useDefaultTuning";
import { useStringsChange } from "@/hooks/useStringsChange";
import { useDisplayPrefs } from "@/hooks/useDisplayPrefs";
import { useInstrumentPrefs } from "@/hooks/useInstrumentPrefs";
import { useSystemPrefs } from "@/hooks/useSystemPrefs";
import { useTuningIO } from "@/hooks/useTuningIO";
import { useMergedPresets } from "@/hooks/useMergedPresets";
import { useFretsTouched } from "@/hooks/useFretsTouched";
import { useSystemNoteNames } from "@/hooks/useSystemNoteNames";
import { useAccidentalRespell } from "@/hooks/useAccidentalRespell";
import { useChordLogic } from "@/hooks/useChordLogic";
import { useFileBase } from "@/hooks/useFileBase";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useCapo } from "@/hooks/useCapo";
import { useResets } from "@/hooks/useResets";
import { useConfirm } from "@/hooks/useConfirm";
import { LABEL_VALUES } from "@/hooks/useLabels";
import { useFullscreen, useToggle, useThrottleFn } from "react-use";

import { pickRandomScale } from "@/utils/random";
import { withToastPromise } from "@/utils/toast";

export default function App() {
  // System selection
  const { systemId, setSystemId, root, setRoot, ensureValidRoot } =
    useSystemPrefs({
      tunings: TUNINGS,
      defaultSystemId: SYSTEM_DEFAULT,
      defaultRoot: ROOT_DEFAULT,
    });

  const system = TUNINGS[systemId];

  // Strings / Frets
  const { frets, setFrets, fretsTouched, setFretsUI, setFretsTouched } =
    useFretsTouched(getFactoryFrets(system.divisions));

  const { strings, setStrings, resetInstrumentPrefs, setFretsPref } =
    useInstrumentPrefs({
      frets,
      fretsTouched,
      setFrets,
      setFretsUI,
      setFretsTouched,
      STR_MIN,
      STR_MAX,
      FRETS_MIN,
      FRETS_MAX,
      STR_FACTORY,
    });

  // Display options
  const [displayPrefs, setDisplayPrefs, displaySetters] =
    useDisplayPrefs(DISPLAY_DEFAULTS);
  const {
    show,
    showOpen,
    showFretNums,
    dotSize,
    lefty,
    openOnlyInScale,
    colorByDegree,
    accidental,
    microLabelStyle,
  } = displayPrefs;

  const {
    setShow,
    setShowOpen,
    setShowFretNums,
    setDotSize,
    setAccidental,
    setMicroLabelStyle,
    setOpenOnlyInScale,
    setColorByDegree,
    setLefty,
  } = displaySetters;

  const [theme, setTheme, themeMode] = useTheme();

  const { confirm } = useConfirm();

  // Refs
  const boardRef = useRef(null);
  const stageRef = useRef(null);

  // Fullscreen (react-use)
  const [isFsRequested, toggleFs] = useToggle(false);
  const isFs = useFullscreen(stageRef, isFsRequested, {
    onClose: () => toggleFs(false),
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isFs) root.classList.add("is-fs");
    else root.classList.remove("is-fs");
    return () => root.classList.remove("is-fs");
  }, [isFs]);

  // Tuning (defaults + presets + meta)
  const {
    tuning,
    setTuning,
    presetMap,
    presetMetaMap,
    presetNames,
    saveDefault,
    savedExists,
    defaultForCount,
  } = useDefaultTuning({
    systemId,
    strings,
    DEFAULT_TUNINGS,
    PRESET_TUNINGS,
    PRESET_TUNING_META,
  });

  const [stringMeta, setStringMeta] = useState(null);
  const [boardMeta, setBoardMeta] = useState(null);

  const handleSaveDefault = useCallback(() => {
    saveDefault(stringMeta, boardMeta);
  }, [saveDefault, stringMeta, boardMeta]);

  const { pcFromName, nameForPc, sysNames } = useSystemNoteNames(
    system,
    accidental,
  );
  useEffect(() => {
    ensureValidRoot(sysNames);
  }, [ensureValidRoot, sysNames]);

  const rootIx = useMemo(() => pcFromName(root), [root, pcFromName]);

  const {
    chordRoot,
    setChordRoot,
    chordType,
    setChordType,
    showChord,
    setShowChord,
    hideNonChord,
    setHideNonChord,
    chordRootIx,
    chordPCs,
  } = useChordLogic(system, pcFromName);

  const { scale, setScale, scaleOptions, intervals } = useScaleOptions({
    system,
    ALL_SCALES,
    initial: SCALE_DEFAULT,
  });

  const drawFrets = useDrawFrets({
    baseFrets: frets,
    divisions: system.divisions,
    fretsTouched,
    setFretsRaw: setFrets,
  });

  const fileBase = useFileBase({ root, scale, accidental, strings });

  useAccidentalRespell({
    system,
    accidental,
    setRoot,
    setTuning,
    setChordRoot,
  });

  const handleStringsChange = useStringsChange({
    setStrings,
    setTuning,
    defaultForCount,
  });

  const {
    customTunings,
    importFromJson,
    exportCurrent,
    exportAll,
    getCurrentTuningPack,
    saveCustomTuning,
    deleteCustomTuning,
    clearCustomTunings,
  } = useTuningIO({ systemId, strings, TUNINGS });

  const {
    mergedPresetNames,
    customPresetNames,
    selectedPreset,
    setPreset,
    resetSelection,
  } = useMergedPresets({
    presetMap,
    presetMetaMap,
    presetNames,
    customTunings,
    setTuning,
    setStringMeta,
    setBoardMeta,
    currentEdo: system.divisions,
    currentStrings: strings,
  });

  const [editorState, setEditorState] = useState(null);
  const [pendingPresetName, setPendingPresetName] = useState(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  useEffect(() => {
    setStringMeta(null);
    setBoardMeta(null);
    resetSelection();
  }, [systemId, strings, resetSelection]);

  useEffect(() => {
    if (!pendingPresetName) return;
    if (mergedPresetNames.includes(pendingPresetName)) {
      setPreset(pendingPresetName);
      setPendingPresetName(null);
    }
  }, [pendingPresetName, mergedPresetNames, setPreset]);

  const randomizeScale = useCallback(() => {
    const result = pickRandomScale({ sysNames, scaleOptions });
    if (!result) return;
    const { root: nextRoot, scale: nextScale } = result;
    setRoot(nextRoot);
    setScale(nextScale);
  }, [sysNames, scaleOptions, setRoot, setScale]);

  const randomizeScaleRef = useRef(randomizeScale);
  useEffect(() => {
    randomizeScaleRef.current = randomizeScale;
  }, [randomizeScale]);

  const [randomizeHotkeyTick, setRandomizeHotkeyTick] = useState(-1);

  useThrottleFn(
    (tick) => {
      if (tick < 0) return;
      randomizeScaleRef.current();
    },
    150,
    [randomizeHotkeyTick],
  );

  const handleSelectNote = useCallback(
    (pc, providedName, event) => {
      const noteName = providedName ?? nameForPc(pc);
      if (!noteName) return;
      if (!sysNames.includes(noteName)) return;

      if (event?.type === "contextmenu" || event?.button === 2) {
        event?.preventDefault?.();
        if (typeof setChordRoot === "function") {
          setChordRoot(noteName);
        }
        return;
      }

      setRoot(noteName);
    },
    [nameForPc, sysNames, setChordRoot, setRoot],
  );

  const handleClearCustomTunings = useCallback(async () => {
    if (typeof clearCustomTunings !== "function") return false;

    if (typeof confirm === "function") {
      const ok = await confirm({
        title: "Clear all custom tunings?",
        message:
          "This will permanently remove every saved custom tuning pack. This action cannot be undone.",
        confirmText: "Clear custom tunings",
        cancelText: "Cancel",
        toastId: "confirm-clear-custom",
      });

      if (!ok) return false;
    }

    return withToastPromise(
      async () => {
        await Promise.resolve(clearCustomTunings());
      },
      {
        loading: "Clearing custom tunings…",
        success: "Custom tunings cleared.",
        error: "Unable to clear custom tunings.",
      },
      "clear-custom-tunings",
    ).then(() => true);
  }, [clearCustomTunings, confirm]);

  const handleRandomizeHotkey = useCallback(() => {
    setRandomizeHotkeyTick((count) => count + 1);
  }, []);

  const showCheatsheet = useCallback(() => {
    toast((t) => <HotkeysCheatsheet onClose={() => toast.dismiss(t.id)} />, {
      id: "hotkeys-help",
      duration: 6000,
    });
  }, []);

  useEffect(() => {
    if (savedExists) setPreset("Saved default");
    else setPreset("Factory default");
  }, [systemId, strings, savedExists, setPreset]);

  const handleCreateCustomPack = useCallback(() => {
    const pack = getCurrentTuningPack(tuning, stringMeta, boardMeta);
    setEditorState({
      mode: "create",
      initialPack: pack,
      originalName: null,
    });
  }, [getCurrentTuningPack, tuning, stringMeta, boardMeta]);

  const handleEditCustomPack = useCallback(() => {
    if (!selectedPreset) return;
    if (!Array.isArray(customPresetNames)) return;
    if (!customPresetNames.includes(selectedPreset)) return;
    const existing = customTunings?.find((p) => p?.name === selectedPreset);
    if (!existing) return;
    setEditorState({
      mode: "edit",
      initialPack: existing,
      originalName: existing.name,
    });
  }, [selectedPreset, customPresetNames, customTunings]);

  const handleOpenManage = useCallback(() => {
    setIsManagerOpen(true);
  }, [setIsManagerOpen]);

  const handleCloseManage = useCallback(() => {
    setIsManagerOpen(false);
  }, [setIsManagerOpen]);

  const handleEditFromManager = useCallback(
    (pack) => {
      if (!pack) return;
      const name = typeof pack?.name === "string" ? pack.name : null;
      setEditorState({
        mode: "edit",
        initialPack: pack,
        originalName: name,
      });
      setIsManagerOpen(false);
    },
    [setEditorState, setIsManagerOpen],
  );

  const handleDeleteCustom = useCallback(
    async (name) => {
      if (typeof deleteCustomTuning !== "function") return false;
      if (typeof name !== "string" || !name.trim()) return false;

      let ok = true;
      if (typeof confirm === "function") {
        ok = await confirm({
          title: "Remove custom tuning?",
          message:
            "This will permanently delete the selected custom tuning pack.",
          confirmText: "Remove pack",
          cancelText: "Cancel",
          toastId: `confirm-delete-${slug(name)}`,
        });
      }

      if (!ok) return false;

      return withToastPromise(
        () => Promise.resolve(deleteCustomTuning(name)),
        {
          loading: "Removing custom tuning…",
          success: "Custom tuning removed.",
          error: "Unable to remove custom tuning.",
        },
        `delete-custom-${slug(name)}`,
      ).then(() => {
        setPendingPresetName((prev) => (prev === name ? null : prev));
        return true;
      });
    },
    [deleteCustomTuning, confirm, setPendingPresetName],
  );

  const handleEditorCancel = useCallback(() => {
    setEditorState(null);
  }, []);

  const handleEditorSubmit = useCallback(
    (pack, options = {}) => {
      const replaceName =
        options?.replaceName ?? editorState?.originalName ?? undefined;
      const mode = editorState?.mode === "edit" ? "edit" : "create";

      return withToastPromise(
        () => saveCustomTuning(pack, { replaceName }),
        {
          loading:
            mode === "edit" ? "Updating custom pack…" : "Saving custom pack…",
          success:
            mode === "edit" ? "Custom pack updated." : "Custom pack created.",
          error: "Unable to save tuning pack.",
        },
        "save-custom-pack",
      ).then((saved) => {
        setPendingPresetName(saved?.name ?? pack?.name ?? null);
        setEditorState(null);
        return saved;
      });
    },
    [editorState, saveCustomTuning, setPendingPresetName, setEditorState],
  );

  const { capoFret, setCapoFret, toggleCapoAt, effectiveStringMeta } = useCapo({
    strings,
    stringMeta,
  });

  useHotkeys({
    toggleFs,
    setDisplayPrefs,
    setFrets: setFretsUI,
    handleStringsChange,
    setShowChord,
    setHideNonChord,
    onShowCheatsheet: showCheatsheet,
    onRandomizeScale: handleRandomizeHotkey,
    onCreateCustomPack: handleCreateCustomPack,
    strings,
    frets,
    LABEL_VALUES,
    minStrings: STR_MIN,
    maxStrings: STR_MAX,
    minFrets: FRETS_MIN,
    maxFrets: FRETS_MAX,
  });

  const { resetInstrumentFactory, resetDisplay, resetAll, resetMusicalState } = useResets({
    system,
    resetInstrumentPrefs,
    setCapoFret,
    setStringMeta,
    setDisplayPrefs,
    setSystemId,
    setRoot,
    setScale,
    setChordRoot,
    setChordType,
    setShowChord,
    setHideNonChord,
    setPreset,
    toast,
    confirm,
  });

  const buildHeader = useCallback(
    () => ({
      system: systemId,
      tuning,
      scale,
      chordEnabled: showChord,
      chordRoot,
      chordType,
    }),
    [systemId, tuning, scale, showChord, chordRoot, chordType],
  );

  return (
    <div className="tv-shell">
      <header className="tv-shell__header">
        <PanelHeader theme={theme} setTheme={setTheme} />
      </header>
      <main className="tv-shell__main">
        <div className="tv-stage" ref={stageRef}>
          <div
            className={clsx("tv-stage__surface", { "is-lefty": lefty })}
            onDoubleClick={() => toggleFs()}
          >
            <div className="tv-stage__toolbar">
              <button
                type="button"
                className="tv-button tv-button--icon"
                aria-label="Reset all to defaults"
                onClick={() => resetAll({ confirm: true })}
                title="Reset all to defaults"
              >
                <FiRefreshCw size={16} aria-hidden />
              </button>
              <button
                type="button"
                className={clsx(
                  "tv-button",
                  "tv-button--icon",
                  "tv-button--fullscreen",
                  { "is-active": isFs },
                )}
                aria-label={
                  isFs ? "Exit fullscreen (Esc)" : "Enter fullscreen (F)"
                }
                onClick={() => toggleFs()}
                title={isFs ? "Exit fullscreen (Esc)" : "Enter fullscreen (F)"}
              >
                {isFs ? (
                  <FiMinimize size={16} aria-hidden />
                ) : (
                  <FiMaximize size={16} aria-hidden />
                )}
              </button>
            </div>
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => {
                setCapoFret(CAPO_DEFAULT);
                setRoot(ROOT_DEFAULT);
              }}
            >
              <Fretboard
                ref={boardRef}
                strings={strings}
                frets={drawFrets}
                tuning={tuning}
                rootIx={rootIx}
                intervals={intervals}
                accidental={accidental}
                microLabelStyle={microLabelStyle}
                show={show}
                showOpen={showOpen}
                showFretNums={showFretNums}
                dotSize={dotSize}
                lefty={lefty}
                system={system}
                chordPCs={chordPCs}
                chordRootPc={chordRootIx}
                openOnlyInScale={openOnlyInScale}
                colorByDegree={colorByDegree}
                hideNonChord={hideNonChord}
                stringMeta={effectiveStringMeta}
                boardMeta={boardMeta}
                onSelectNote={handleSelectNote}
                capoFret={capoFret}
                onSetCapo={toggleCapoAt}
              />
            </ErrorBoundary>
          </div>
        </div>
      </main>
      <footer className="tv-shell__controls">
        <TuningSystemSelector
          systemId={systemId}
          setSystemId={setSystemId}
          systems={TUNINGS}
        />
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          resetKeys={[systemId, root, scale]}
          onReset={resetMusicalState}
        >
          <ScaleControls
            root={root}
            setRoot={setRoot}
            scale={scale}
            setScale={setScale}
            sysNames={sysNames}
            scaleOptions={scaleOptions}
            defaultScale={SCALE_DEFAULT}
          />
        </ErrorBoundary>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          resetKeys={[chordRoot, chordType, showChord, hideNonChord]}
          onReset={resetMusicalState}
        >
          <ChordBuilder
            root={chordRoot}
            onRootChange={setChordRoot}
            sysNames={sysNames}
            nameForPc={nameForPc}
            type={chordType}
            onTypeChange={setChordType}
            showChord={showChord}
            setShowChord={setShowChord}
            hideNonChord={hideNonChord}
            setHideNonChord={setHideNonChord}
            supportsMicrotonal={system.divisions === 24}
            system={system}
            rootIx={rootIx}
            intervals={intervals}
            chordPCs={chordPCs}
            chordRootPc={chordRootIx}
          />
        </ErrorBoundary>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          resetKeys={[strings, frets, systemId]}
          onReset={() => {
            resetInstrumentFactory(system.divisions);
          }}
        >
          <InstrumentControls
            strings={strings}
            setStrings={setStrings}
            frets={frets}
            setFrets={setFretsPref}
            sysNames={sysNames}
            tuning={tuning}
            setTuning={setTuning}
            handleStringsChange={handleStringsChange}
            presetNames={mergedPresetNames}
            customPresetNames={customPresetNames}
            selectedPreset={selectedPreset}
            setSelectedPreset={setPreset}
            handleSaveDefault={handleSaveDefault}
            handleResetFactoryDefault={resetInstrumentFactory}
            systemId={systemId}
            onCreateCustomPack={handleCreateCustomPack}
            onEditCustomPack={handleEditCustomPack}
          />
        </ErrorBoundary>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          resetKeys={[displayPrefs]}
          onReset={() => {
            resetDisplay();
          }}
        >
          <DisplayControls
            show={show}
            setShow={setShow}
            showOpen={showOpen}
            setShowOpen={setShowOpen}
            showFretNums={showFretNums}
            setShowFretNums={setShowFretNums}
            dotSize={dotSize}
            setDotSize={setDotSize}
            accidental={accidental}
            setAccidental={setAccidental}
            microLabelStyle={microLabelStyle}
            setMicroLabelStyle={setMicroLabelStyle}
            openOnlyInScale={openOnlyInScale}
            setOpenOnlyInScale={setOpenOnlyInScale}
            colorByDegree={colorByDegree}
            setColorByDegree={setColorByDegree}
            lefty={lefty}
            setLefty={setLefty}
            degreeCount={intervals.length}
          />
        </ErrorBoundary>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          resetKeys={[fileBase]}
        >
          <ExportControls
            boardRef={boardRef}
            fileBase={fileBase}
            downloadPNG={downloadPNG}
            downloadSVG={downloadSVG}
            printFretboard={printFretboard}
            buildHeader={buildHeader}
            exportCurrent={() => exportCurrent(tuning, stringMeta, boardMeta)}
            exportAll={exportAll}
            importFromJson={importFromJson}
            onClearCustom={handleClearCustomTunings}
            onManageCustom={handleOpenManage}
          />
        </ErrorBoundary>
      </footer>
      {editorState ? (
        <React.Suspense
          fallback={
            <div className="tv-modal-suspense" role="status" aria-live="polite">
              Loading editor...
            </div>
          }
        >
          <TuningPackEditorModal
            isOpen={Boolean(editorState)}
            mode={editorState?.mode ?? "create"}
            initialPack={editorState?.initialPack}
            originalName={editorState?.originalName ?? undefined}
            onCancel={handleEditorCancel}
            onSubmit={handleEditorSubmit}
            themeMode={themeMode}
          />
        </React.Suspense>
      ) : null}
      {isManagerOpen ? (
        <React.Suspense
          fallback={
            <div className="tv-modal-suspense" role="status" aria-live="polite">
              Loading manager...
            </div>
          }
        >
          <TuningPackManagerModal
            isOpen={isManagerOpen}
            tunings={customTunings}
            systems={TUNINGS}
            themeMode={themeMode}
            onClose={handleCloseManage}
            onEdit={handleEditFromManager}
            onDelete={handleDeleteCustom}
          />
        </React.Suspense>
      ) : null}
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 2800,
          className: "tv-toast",
        }}
        containerClassName="tv-toast-container"
      >
        {(t) => {
          const icon =
            t.type === "success" ? (
              <FiCheckCircle size={18} color="var(--accent)" />
            ) : t.type === "error" ? (
              <FiAlertTriangle size={18} color="var(--root)" />
            ) : t.type === "loading" ? (
              <FiLoader size={18} className="tv-u-spin" />
            ) : (
              <FiInfo size={18} color="var(--fg)" />
            );
          return (
            <ToastBar toast={t}>
              {({ message, action }) => (
                <div className="tv-toast-bar">
                  <span className="tv-toast-icon">{icon}</span>
                  <div>{message}</div>
                  {action}
                </div>
              )}
            </ToastBar>
          );
        }}
      </Toaster>
    </div>
  );
}
