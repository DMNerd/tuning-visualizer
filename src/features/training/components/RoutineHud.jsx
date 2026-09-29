import { useTranslation } from "react-i18next";
import { nameForRootPc } from "@features/training/model/routine";

export default function RoutineHud({
  routine,
  stepIndex,
  elapsedBeats,
  isPaused,
  onPause,
  onResume,
  onStop,
  accidental,
  noteNaming,
}) {
  const { t } = useTranslation();
  if (!routine) return null;

  const step = routine.steps[stepIndex];
  if (!step) return null;

  return (
    <div className="tv-routine-hud" aria-live="polite">
      <div className="tv-routine-hud__header">
        <span className="tv-routine-hud__name">
          {routine.name || t("training.untitled")}
        </span>
        <span className="tv-routine-hud__step">
          {t("training.hudBlock", {
            current: stepIndex + 1,
            total: routine.steps.length,
          })}
        </span>
      </div>

      <div className="tv-routine-hud__block">
        <span>{step.scaleLabel || t("training.noScale")}</span>
        <span>
          {nameForRootPc(
            routine.startBlock.systemId,
            step.rootPc,
            accidental,
            noteNaming,
          )}
        </span>
        <span>{t("training.hudBpm", { bpm: step.bpm })}</span>
        <span>{step.timeSig}</span>
      </div>

      <div className="tv-routine-hud__progress">
        {t("training.hudBeat", {
          current: Math.min(elapsedBeats + 1, step.beats),
          total: step.beats,
        })}
      </div>

      <div className="tv-routine-hud__actions">
        {isPaused ? (
          <button type="button" className="tv-button" onClick={onResume}>
            {t("training.resume")}
          </button>
        ) : (
          <button type="button" className="tv-button" onClick={onPause}>
            {t("training.pause")}
          </button>
        )}
        <button
          type="button"
          className="tv-button tv-button--danger"
          onClick={onStop}
        >
          {t("training.stop")}
        </button>
      </div>
    </div>
  );
}
