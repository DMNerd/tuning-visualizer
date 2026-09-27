import NumberField from "@shared/ui/NumberField";
import {
  ROUTINE_BEATS_MAX,
  ROUTINE_BEATS_MIN,
  ROUTINE_BPM_MAX,
  ROUTINE_BPM_MIN,
} from "@features/training/model/routineLimits";
import { ROUTINE_TIME_SIGNATURES } from "@features/training/model/routineTimeSignatures";
import { optionsWithFallback } from "@features/training/model/routineOptions";

// One scale step in the routine chain, with its reorder/remove controls.
export default function RoutineScaleBlock({
  step,
  index,
  stepCount,
  scaleLabelOptions,
  rootPcOptions,
  rootLabel,
  onMove,
  onRemove,
  onUpdate,
}) {
  return (
    <div>
      <div className="tv-routine-chain__connector" aria-hidden="true" />
      <div className="tv-routine-block tv-routine-block--scale">
        <div className="tv-routine-block__header">
          <h3>Scale block {index + 1}</h3>
          <div className="tv-routine-block__actions">
            <button
              type="button"
              className="tv-button tv-button--icon tv-button--ghost"
              onClick={() => onMove(step.id, "up")}
              disabled={index === 0}
              aria-label="Move block up"
              title="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              className="tv-button tv-button--icon tv-button--ghost"
              onClick={() => onMove(step.id, "down")}
              disabled={index === stepCount - 1}
              aria-label="Move block down"
              title="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              className="tv-button tv-button--icon tv-button--ghost tv-button--danger"
              onClick={() => onRemove(step.id)}
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
                onUpdate(step.id, {
                  scaleLabel: event.target.value,
                })
              }
            >
              <option value="">(choose a scale)</option>
              {optionsWithFallback(scaleLabelOptions, step.scaleLabel).map(
                (label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="tv-field">
            <span className="tv-field__label">Root</span>
            <select
              value={step.rootPc}
              onChange={(event) =>
                onUpdate(step.id, {
                  rootPc: Number(event.target.value),
                })
              }
            >
              {rootPcOptions.map((pc) => (
                <option key={pc} value={pc}>
                  {rootLabel(pc)}
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
            onSubmit={(value) => onUpdate(step.id, { beats: value })}
          />

          <NumberField
            id={`routine-step-bpm-${step.id}`}
            label="Tempo (BPM)"
            value={step.bpm}
            min={ROUTINE_BPM_MIN}
            max={ROUTINE_BPM_MAX}
            onSubmit={(value) => onUpdate(step.id, { bpm: value })}
          />

          <label className="tv-field">
            <span className="tv-field__label">Time signature</span>
            <select
              value={step.timeSig}
              onChange={(event) =>
                onUpdate(step.id, {
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
  );
}
