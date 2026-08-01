import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useLatest } from "react-use";
import { toast } from "react-hot-toast";

import ModalFrame from "@shared/ui/ModalFrame";
import NumberField from "@shared/ui/NumberField";
import { useConfirm } from "@shared/hooks/useConfirm";
import { copyTextWithFallback } from "@shared/lib/clipboard";
import { TUNINGS } from "@domain/theory/tuning";
import {
  resolvePresetNamesForSystem,
  resolveScaleOptionsForSystem,
} from "@features/training/model/routine";
import {
  ROUTINE_BEATS_MAX,
  ROUTINE_BEATS_MIN,
  ROUTINE_BPM_MAX,
  ROUTINE_BPM_MIN,
} from "@features/training/model/routineLimits";
import { ROUTINE_TIME_SIGNATURES } from "@features/training/model/routineTimeSignatures";
import { buildRoutineShareModel } from "@features/training/model/routineShareModel";
import { useRoutineDraft } from "@features/training/hooks/useRoutineDraft";
import { useTrainingRoutines } from "@features/training/hooks/useTrainingRoutines";
import ShareQrCode from "@features/share/components/ShareQrCode";

function optionsWithFallback(options, currentValue) {
  if (!currentValue || options.includes(currentValue)) return options;
  // Preserve a value decoded from a link/older catalog that no longer
  // matches a current option, rather than silently dropping it.
  return [...options, currentValue];
}

export default function RoutineBuilderModal({
  isOpen,
  onClose,
  initialRoutine,
  onConsumedInitialRoutine,
}) {
  const { confirm } = useConfirm();
  const { routines, upsertRoutine, renameRoutine, removeRoutine } =
    useTrainingRoutines();
  const {
    draft,
    loadDraft,
    resetDraft,
    renameDraft,
    setStartBlock,
    addScaleBlock,
    updateScaleBlock,
    removeScaleBlock,
    moveScaleBlock,
  } = useRoutineDraft(initialRoutine);

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const onConsumedInitialRoutineRef = useLatest(onConsumedInitialRoutine);

  useEffect(() => {
    if (!initialRoutine) return;
    loadDraft(initialRoutine);
    onConsumedInitialRoutineRef.current?.();
  }, [initialRoutine, loadDraft, onConsumedInitialRoutineRef]);

  const systemIds = useMemo(() => Object.keys(TUNINGS), []);
  const divisions = TUNINGS[draft.startBlock.systemId]?.divisions ?? 12;
  const nameForPc = TUNINGS[draft.startBlock.systemId]?.nameForPc ?? ((pc) => `N${pc}`);

  const scaleOptions = useMemo(
    () => resolveScaleOptionsForSystem(draft.startBlock.systemId, divisions),
    [draft.startBlock.systemId, divisions],
  );
  const scaleLabelOptions = useMemo(
    () => scaleOptions.map((scale) => scale.label),
    [scaleOptions],
  );
  const presetOptions = useMemo(
    () => resolvePresetNamesForSystem(draft.startBlock.systemId),
    [draft.startBlock.systemId],
  );
  const rootPcOptions = useMemo(
    () => Array.from({ length: divisions }, (_, pc) => pc),
    [divisions],
  );

  // Encoding the routine and regenerating the QR code is comparatively
  // expensive; deferring it keeps every keystroke in the name/number fields
  // responsive instead of re-encoding on each one.
  const deferredDraft = useDeferredValue(draft);
  const shareModel = useMemo(
    () =>
      buildRoutineShareModel({
        routine: deferredDraft,
        locationLike: typeof window === "undefined" ? null : window.location,
      }),
    [deferredDraft],
  );

  const handleSave = () => {
    const name = draft.name.trim() || "Untitled routine";
    upsertRoutine({ ...draft, name, updatedAt: Date.now() });
    if (draft.name.trim() !== name) renameDraft(name);
    toast.success("Routine saved.", { id: "training-routine-save" });
  };

  const handleLoad = (routine) => {
    loadDraft(routine);
  };

  const startRename = (routine) => {
    setRenamingId(routine.id);
    setRenameValue(routine.name || "");
  };

  const commitRename = (id) => {
    renameRoutine(id, renameValue.trim() || "Untitled routine");
    setRenamingId(null);
  };

  const handleDelete = async (routine) => {
    const ok = await confirm({
      title: "Delete routine?",
      message: `This will permanently delete "${routine.name || "Untitled routine"}".`,
      confirmText: "Delete routine",
      cancelText: "Cancel",
      toastId: `confirm-delete-routine-${routine.id}`,
    });
    if (!ok) return;
    removeRoutine(routine.id);
  };

  const copyLink = async () => {
    try {
      await copyTextWithFallback(shareModel.canonicalUrl);
      toast.success("Routine link copied.", { id: "training-routine-copy" });
    } catch {
      toast.error("Could not copy routine link.", {
        id: "training-routine-copy",
      });
    }
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Training Routine Builder"
      cardClassName="tv-modal__card"
    >
      <header className="tv-modal__header">
        <h2>Training Routine Builder</h2>
        <p className="tv-modal__summary">
          Chain scale drills into a linear practice routine, then save it or
          share a link.
        </p>
      </header>

      <div className="tv-modal__body tv-routine-modal__body">
        <label className="tv-field">
          <span className="tv-field__label">Routine name</span>
          <input
            type="text"
            value={draft.name}
            onChange={(event) => renameDraft(event.target.value)}
            placeholder="Untitled routine"
          />
        </label>

        <section aria-label="Routine chain" className="tv-routine-chain">
          <div className="tv-routine-block tv-routine-block--start">
            <h3>Start</h3>
            <div className="tv-controls__grid--two">
              <label className="tv-field">
                <span className="tv-field__label">Tuning system</span>
                <select
                  value={draft.startBlock.systemId}
                  onChange={(event) =>
                    setStartBlock({ systemId: event.target.value })
                  }
                >
                  {systemIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="tv-field">
                <span className="tv-field__label">Preset</span>
                <select
                  value={draft.startBlock.presetName}
                  onChange={(event) =>
                    setStartBlock({ presetName: event.target.value })
                  }
                >
                  <option value="">(none)</option>
                  {optionsWithFallback(
                    presetOptions,
                    draft.startBlock.presetName,
                  ).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <NumberField
                id="routine-start-beats"
                label="Starting beats"
                value={draft.startBlock.beats}
                min={ROUTINE_BEATS_MIN}
                max={ROUTINE_BEATS_MAX}
                onSubmit={(value) => setStartBlock({ beats: value })}
              />
            </div>
          </div>

          {draft.steps.map((step, index) => (
            <div key={step.id}>
              <div className="tv-routine-chain__connector" aria-hidden="true" />
              <div className="tv-routine-block tv-routine-block--scale">
                <div className="tv-routine-block__header">
                  <h3>Scale block {index + 1}</h3>
                  <div className="tv-routine-block__actions">
                    <button
                      type="button"
                      className="tv-button tv-button--icon tv-button--ghost"
                      onClick={() => moveScaleBlock(step.id, "up")}
                      disabled={index === 0}
                      aria-label="Move block up"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="tv-button tv-button--icon tv-button--ghost"
                      onClick={() => moveScaleBlock(step.id, "down")}
                      disabled={index === draft.steps.length - 1}
                      aria-label="Move block down"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="tv-button tv-button--icon tv-button--ghost tv-button--danger"
                      onClick={() => removeScaleBlock(step.id)}
                      aria-label="Remove block"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="tv-controls__grid--two">
                  <label className="tv-field">
                    <span className="tv-field__label">Scale</span>
                    <select
                      value={step.scaleLabel}
                      onChange={(event) =>
                        updateScaleBlock(step.id, {
                          scaleLabel: event.target.value,
                        })
                      }
                    >
                      <option value="">(choose a scale)</option>
                      {optionsWithFallback(
                        scaleLabelOptions,
                        step.scaleLabel,
                      ).map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="tv-field">
                    <span className="tv-field__label">Root</span>
                    <select
                      value={step.rootPc}
                      onChange={(event) =>
                        updateScaleBlock(step.id, {
                          rootPc: Number(event.target.value),
                        })
                      }
                    >
                      {rootPcOptions.map((pc) => (
                        <option key={pc} value={pc}>
                          {nameForPc(pc)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <NumberField
                    id={`routine-step-beats-${step.id}`}
                    label="Beats"
                    value={step.beats}
                    min={ROUTINE_BEATS_MIN}
                    max={ROUTINE_BEATS_MAX}
                    onSubmit={(value) =>
                      updateScaleBlock(step.id, { beats: value })
                    }
                  />

                  <NumberField
                    id={`routine-step-bpm-${step.id}`}
                    label="Tempo (BPM)"
                    value={step.bpm}
                    min={ROUTINE_BPM_MIN}
                    max={ROUTINE_BPM_MAX}
                    onSubmit={(value) =>
                      updateScaleBlock(step.id, { bpm: value })
                    }
                  />

                  <label className="tv-field">
                    <span className="tv-field__label">Time signature</span>
                    <select
                      value={step.timeSig}
                      onChange={(event) =>
                        updateScaleBlock(step.id, {
                          timeSig: event.target.value,
                        })
                      }
                    >
                      {ROUTINE_TIME_SIGNATURES.map((sig) => (
                        <option key={sig} value={sig}>
                          {sig}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={addScaleBlock}
          >
            Add scale block
          </button>
        </section>

        <section aria-label="My Routines" className="tv-modal__manager">
          <div className="tv-modal__manager-toolbar">
            <h3>My Routines</h3>
            <button
              type="button"
              className="tv-button"
              onClick={() => resetDraft(draft.startBlock.systemId)}
            >
              New routine
            </button>
          </div>
          {routines.length ? (
            <ul className="tv-modal__manager-list">
              {routines.map((routine) => (
                <li key={routine.id} className="tv-modal__manager-item">
                  {renamingId === routine.id ? (
                    <input
                      type="text"
                      value={renameValue}
                      autoFocus
                      onChange={(event) => setRenameValue(event.target.value)}
                      onBlur={() => commitRename(routine.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") commitRename(routine.id);
                        if (event.key === "Escape") setRenamingId(null);
                      }}
                    />
                  ) : (
                    <span className="tv-modal__manager-pack-name">
                      {routine.name || "Untitled routine"}
                    </span>
                  )}
                  <div className="tv-modal__manager-actions">
                    <button
                      type="button"
                      className="tv-button"
                      onClick={() => handleLoad(routine)}
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      className="tv-button"
                      onClick={() => startRename(routine)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="tv-button tv-button--danger"
                      onClick={() => void handleDelete(routine)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tv-field__help">No saved routines yet.</p>
          )}
        </section>

        <div className="tv-share-modal__grid">
          <section
            className="tv-share-modal__panel"
            aria-label="Routine link preview"
          >
            <label className="tv-field">
              <span className="tv-field__label">Routine link</span>
              <pre className="tv-textarea" aria-label="Routine link preview">
                {shareModel.presentableUrl}
              </pre>
              <span
                className="tv-field__help"
                data-warn={shareModel.sizeEvaluation.warn ? "true" : "false"}
              >
                Length: {shareModel.sizeEvaluation.length}
                {shareModel.sizeEvaluation.reasonCode === "warning-threshold"
                  ? " (Long URL warning)"
                  : ""}
                {shareModel.sizeEvaluation.reasonCode === "qr-hard-limit"
                  ? " (Too long for QR)"
                  : ""}
              </span>
            </label>
          </section>

          <section
            className="tv-share-modal__panel tv-share-modal__panel--qr"
            aria-label="Routine QR preview"
          >
            <span className="tv-field__label">QR preview</span>
            {shareModel.sizeEvaluation.allowQr ? (
              <div className="tv-share-modal__qr-wrap" aria-live="polite">
                <ShareQrCode value={shareModel.canonicalUrl} size={176} />
              </div>
            ) : (
              <p className="tv-field__help tv-field__help--error" role="status">
                Routine is too long for QR generation. Try fewer blocks or use
                link copy instead.
              </p>
            )}
          </section>
        </div>
      </div>

      <footer className="tv-modal__footer">
        <button type="button" className="tv-button" onClick={onClose}>
          Close
        </button>
        <button
          type="button"
          className="tv-button"
          onClick={() => void copyLink()}
        >
          Copy routine link
        </button>
        <button
          type="button"
          className="tv-button tv-button--primary"
          onClick={handleSave}
        >
          Save to My Routines
        </button>
      </footer>
    </ModalFrame>
  );
}
