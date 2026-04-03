import clsx from "clsx";
import { FiMaximize, FiMinimize, FiRotateCcw } from "react-icons/fi";
import BeatIndicator from "@/components/UI/BeatIndicator";

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
  audioReady,
  audioError,
}) {
  return (
    <div className="tv-stage-hud" aria-live="polite">
      <div className="tv-stage-hud__toolbar">
        <button
          type="button"
          className="tv-button tv-button--icon"
          aria-label="Reset all to defaults"
          onClick={onResetAll}
          title="Reset all to defaults"
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
          aria-label={isFs ? "Exit fullscreen (Esc)" : "Enter fullscreen (F)"}
          onClick={onToggleFs}
          title={isFs ? "Exit fullscreen (Esc)" : "Enter fullscreen (F)"}
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
          />

          <div className="tv-stage-hud__badges">
            {countInEnabled ? (
              <span className="tv-stage-hud__badge">Count-in enabled</span>
            ) : null}
            <span
              className={clsx("tv-stage-hud__badge", {
                "is-error": Boolean(audioError),
              })}
            >
              {audioError
                ? `Audio error: ${audioError}`
                : audioReady
                  ? "Audio ready"
                  : "Audio idle"}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default StageHud;
