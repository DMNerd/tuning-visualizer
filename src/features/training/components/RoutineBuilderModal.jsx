import { useDeferredValue, useEffect, useMemo } from "react";
import { useLatest } from "@shared/hooks/stateHooks";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

import ModalFrame from "@shared/ui/ModalFrame";
import NumberField from "@shared/ui/NumberField";
import { confirm } from "@shared/ui/confirm";
import { copyTextWithFallback } from "@shared/lib/clipboard";
import { STR_MAX, STR_MIN } from "@shared/config/appDefaults";
import { TUNINGS } from "@domain/theory/tuning";
import {
  nameForRootPc,
  resolvePresetNamesForSystem,
  resolveScaleOptionsForSystem,
} from "@features/training/model/routine";
import {
  ROUTINE_BEATS_MAX,
  ROUTINE_BEATS_MIN,
} from "@features/training/model/routineLimits";
import { buildRoutineShareModel } from "@features/training/model/routineShareModel";
import { useRoutineDraft } from "@features/training/hooks/useRoutineDraft";
import { useTrainingRoutines } from "@features/training/hooks/useTrainingRoutines";
import {
  useRoutinePlaybackStore,
  selectActiveRoutine,
  selectIsRoutinePlaying,
} from "@features/training/store/useRoutinePlaybackStore";
import RoutineLibrary from "@features/training/components/RoutineLibrary";
import RoutineScaleBlock from "@features/training/components/RoutineScaleBlock";
import SharePreview from "@features/share/components/SharePreview";
import { optionsWithFallback } from "@features/training/model/routineOptions";
import { presetDisplayName } from "@features/instrument/model/presetBadges";

export default function RoutineBuilderModal({
  isOpen,
  onClose,
  initialRoutine,
  onConsumedInitialRoutine,
  routinePlayback,
  liveDefaults,
}) {
  const { t } = useTranslation();
  const accidental = liveDefaults?.accidental;
  const noteNaming = liveDefaults?.noteNaming;
  // Single-field selectors, not the full playback state — this modal only
  // needs to know what/whether something is playing, not live beat
  // progress, and it stays mounted (just hidden) for the whole playback
  // session, so subscribing to per-beat state would re-render it for
  // nothing every beat.
  const playingRoutine = useRoutinePlaybackStore(selectActiveRoutine);
  const isRoutinePlaying = useRoutinePlaybackStore(selectIsRoutinePlaying);
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
  } = useRoutineDraft(initialRoutine, liveDefaults);

  const onConsumedInitialRoutineRef = useLatest(onConsumedInitialRoutine);

  useEffect(() => {
    if (!initialRoutine) return;
    loadDraft(initialRoutine);
    onConsumedInitialRoutineRef.current?.();
  }, [initialRoutine, loadDraft, onConsumedInitialRoutineRef]);

  // Re-seed the Start block from the app's *current* tuning every time the
  // builder is opened fresh (not loading an imported/edited routine) — this
  // hook only mounts once for the app's lifetime, so without this the draft
  // would otherwise be stuck on whatever tuning was live the first time the
  // builder ever opened. Only touches a still-pristine draft (untouched
  // name, no scale blocks yet) so it never clobbers in-progress work.
  const draftRef = useLatest(draft);
  const liveDefaultsRef = useLatest(liveDefaults);
  const resetDraftRef = useLatest(resetDraft);
  useEffect(() => {
    if (!isOpen || initialRoutine) return;
    const live = liveDefaultsRef.current;
    const currentDraft = draftRef.current;
    const isPristine =
      !currentDraft.name.trim() && currentDraft.steps.length === 0;
    if (!isPristine || !live) return;
    resetDraftRef.current(live.systemId, live.strings, live.presetName);
  }, [isOpen, initialRoutine, draftRef, liveDefaultsRef, resetDraftRef]);

  const systemIds = useMemo(() => Object.keys(TUNINGS), []);
  const divisions = TUNINGS[draft.startBlock.systemId]?.divisions ?? 12;
  const hasSteps = draft.steps.length > 0;

  const scaleOptions = useMemo(
    () => resolveScaleOptionsForSystem(draft.startBlock.systemId, divisions),
    [draft.startBlock.systemId, divisions],
  );
  const scaleLabelOptions = useMemo(
    () => scaleOptions.map((scale) => scale.label),
    [scaleOptions],
  );
  const presetOptions = useMemo(
    () =>
      resolvePresetNamesForSystem(
        draft.startBlock.systemId,
        draft.startBlock.strings,
      ),
    [draft.startBlock.systemId, draft.startBlock.strings],
  );
  const rootLabel = (pc) =>
    nameForRootPc(draft.startBlock.systemId, pc, accidental, noteNaming);
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
    const name = draft.name.trim() || t("training.untitled");
    upsertRoutine({ ...draft, name, updatedAt: Date.now() });
    if (draft.name.trim() !== name) renameDraft(name);
    toast.success(t("training.saved"), { id: "training-routine-save" });
  };

  const handlePlay = (routine) => {
    routinePlayback?.play?.(routine);
    onClose();
  };

  const handleDelete = async (routine) => {
    const ok = await confirm({
      title: t("training.deleteTitle"),
      message: t("training.deleteMessage", {
        name: routine.name || t("training.untitled"),
      }),
      confirmText: t("training.deleteConfirm"),
      cancelText: t("common.cancel"),
      toastId: `confirm-delete-routine-${routine.id}`,
    });
    if (!ok) return;
    removeRoutine(routine.id);
  };

  const copyLink = async () => {
    try {
      await copyTextWithFallback(shareModel.canonicalUrl);
      toast.success(t("training.linkCopied"), {
        id: "training-routine-copy",
      });
    } catch {
      toast.error(t("training.linkCopyFailed"), {
        id: "training-routine-copy",
      });
    }
  };

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t("training.builderTitle")}
      cardClassName="tv-modal__card"
    >
      <header className="tv-modal__header">
        <h2>{t("training.builderTitle")}</h2>
        <p className="tv-modal__summary">{t("training.builderSummary")}</p>
      </header>

      <div className="tv-modal__body tv-routine-modal__body">
        <label className="tv-field">
          <span className="tv-field__label">{t("training.name")}</span>
          <input
            type="text"
            className="tv-routine-name-input"
            value={draft.name}
            onChange={(event) => renameDraft(event.target.value)}
            placeholder={t("training.untitled")}
          />
        </label>

        <section aria-label={t("training.chain")} className="tv-routine-chain">
          <div className="tv-routine-block tv-routine-block--start">
            <h3>{t("training.start")}</h3>
            <div className="tv-controls__grid--two">
              <label className="tv-field">
                <span className="tv-field__label">
                  {t("training.tuningSystem")}
                </span>
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

              <NumberField
                id="routine-start-strings"
                label={t("training.strings")}
                value={draft.startBlock.strings}
                min={STR_MIN}
                max={STR_MAX}
                onSubmit={(value) => setStartBlock({ strings: value })}
              />

              <label className="tv-field">
                <span className="tv-field__label">{t("training.preset")}</span>
                <select
                  value={draft.startBlock.presetName}
                  onChange={(event) =>
                    setStartBlock({ presetName: event.target.value })
                  }
                >
                  <option value="">{t("training.noPreset")}</option>
                  {optionsWithFallback(
                    presetOptions,
                    draft.startBlock.presetName,
                  ).map((name) => (
                    <option key={name} value={name}>
                      {presetDisplayName(t, name)}
                    </option>
                  ))}
                </select>
              </label>

              <NumberField
                id="routine-start-beats"
                label={t("training.startingBeats")}
                value={draft.startBlock.beats}
                min={ROUTINE_BEATS_MIN}
                max={ROUTINE_BEATS_MAX}
                onSubmit={(value) => setStartBlock({ beats: value })}
              />
            </div>
          </div>

          {draft.steps.map((step, index) => (
            <RoutineScaleBlock
              key={step.id}
              step={step}
              index={index}
              stepCount={draft.steps.length}
              scaleLabelOptions={scaleLabelOptions}
              rootPcOptions={rootPcOptions}
              rootLabel={rootLabel}
              onMove={moveScaleBlock}
              onRemove={removeScaleBlock}
              onUpdate={updateScaleBlock}
            />
          ))}

          <button
            type="button"
            className="tv-button tv-button--block"
            onClick={addScaleBlock}
          >
            {t("training.addBlock")}
          </button>
        </section>

        <RoutineLibrary
          routines={routines}
          isRoutinePlaying={isRoutinePlaying}
          playingRoutine={playingRoutine}
          onNewRoutine={() =>
            resetDraft(
              liveDefaults?.systemId ?? draft.startBlock.systemId,
              liveDefaults?.strings,
              liveDefaults?.presetName,
            )
          }
          onStop={() => routinePlayback?.stop?.()}
          onPlay={handlePlay}
          onLoad={loadDraft}
          onRename={renameRoutine}
          onDelete={(routine) => void handleDelete(routine)}
        />

        {hasSteps ? (
          <SharePreview
            shareModel={shareModel}
            linkLabel={t("training.link")}
            linkAriaLabel={t("training.linkPreview")}
            qrAriaLabel={t("training.qrPreviewAria")}
            qrTooLongText={t("training.qrTooLong")}
          />
        ) : (
          <p className="tv-field__help">{t("training.needBlockForLink")}</p>
        )}
      </div>

      <footer className="tv-modal__footer">
        <button type="button" className="tv-button" onClick={onClose}>
          {t("common.close")}
        </button>
        <button
          type="button"
          className="tv-button"
          onClick={() => void copyLink()}
          disabled={!hasSteps}
        >
          {t("training.copyLink")}
        </button>
        <button type="button" className="tv-button" onClick={handleSave}>
          {t("training.save")}
        </button>
        <button
          type="button"
          className="tv-button tv-button--primary"
          onClick={() => handlePlay(draft)}
          disabled={isRoutinePlaying || !hasSteps}
        >
          {t("training.play")}
        </button>
      </footer>
    </ModalFrame>
  );
}
