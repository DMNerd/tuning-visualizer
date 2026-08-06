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
  if (!routine) return null;

  const step = routine.steps[stepIndex];
  if (!step) return null;

  return (
    <div className="tv-routine-hud" aria-live="polite">
      <div className="tv-routine-hud__header">
        <span className="tv-routine-hud__name">
          {routine.name || "Untitled routine"}
        </span>
        <span className="tv-routine-hud__step">
          Block {stepIndex + 1} of {routine.steps.length}
        </span>
      </div>

      <div className="tv-routine-hud__block">
        <span>{step.scaleLabel || "(no scale)"}</span>
        <span>
          {nameForRootPc(
            routine.startBlock.systemId,
            step.rootPc,
            accidental,
            noteNaming,
          )}
        </span>
        <span>{step.bpm} BPM</span>
        <span>{step.timeSig}</span>
      </div>

      <div className="tv-routine-hud__progress">
        Beat {Math.min(elapsedBeats + 1, step.beats)} of {step.beats}
      </div>

      <div className="tv-routine-hud__actions">
        {isPaused ? (
          <button type="button" className="tv-button" onClick={onResume}>
            Resume
          </button>
        ) : (
          <button type="button" className="tv-button" onClick={onPause}>
            Pause
          </button>
        )}
        <button
          type="button"
          className="tv-button tv-button--danger"
          onClick={onStop}
        >
          Stop
        </button>
      </div>
    </div>
  );
}
