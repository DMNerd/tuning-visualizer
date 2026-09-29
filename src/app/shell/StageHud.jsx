import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { FiMaximize, FiMinimize, FiRotateCcw } from "react-icons/fi";
import { BeatIndicator } from "@features/practice";

function StageHud({
  isFs,
  onToggleFs,
  onResetAll,
  currentBeat,
  currentBar,
  timeSig,
  isPlaying,
  showPracticeHud = true,
  countInEnabled,
  timedPracticeEnabled,
  practiceSecondsRemaining,
  audioReady,
  audioError,
}) {
  const { t } = useTranslation();
  const fsLabel = isFs
    ? t("stageHud.exitFullscreen")
    : t("stageHud.enterFullscreen");

  return (
    <div className="tv-stage-hud" aria-live="polite">
      <div className="tv-stage-hud__toolbar">
        <button
          type="button"
          className="tv-button tv-button--icon"
          aria-label={t("stageHud.resetAll")}
          onClick={onResetAll}
          title={t("stageHud.resetAll")}
        >
          <FiRotateCcw size={16} aria-hidden />
        </button>
        <button
          type="button"
          className={clsx(
            "tv-button",
            "tv-button--icon",
            "tv-button--fullscreen",
            { "is-active": isFs },
          )}
          aria-label={fsLabel}
          onClick={onToggleFs}
          title={fsLabel}
        >
          {isFs ? (
            <FiMinimize size={16} aria-hidden />
          ) : (
            <FiMaximize size={16} aria-hidden />
          )}
        </button>
      </div>

      {showPracticeHud ? (
        <>
          <BeatIndicator
            className="tv-stage-hud__beat-indicator"
            currentBeat={currentBeat}
            currentBar={currentBar}
            timeSig={timeSig}
            isPlaying={isPlaying}
            timedPracticeEnabled={timedPracticeEnabled}
            practiceSecondsRemaining={practiceSecondsRemaining}
          />

          <div className="tv-stage-hud__badges">
            {countInEnabled ? (
              <span className="tv-stage-hud__badge">
                {t("stageHud.countIn")}
              </span>
            ) : null}
            <span
              className={clsx("tv-stage-hud__badge", {
                "is-error": Boolean(audioError),
              })}
            >
              {audioError
                ? t("stageHud.audioError", { error: audioError })
                : audioReady
                  ? t("stageHud.audioReady")
                  : t("stageHud.audioIdle")}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default StageHud;
