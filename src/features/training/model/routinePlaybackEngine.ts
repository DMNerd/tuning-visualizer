import type { RoutineScaleBlock } from "@features/training/model/routine";

export type PlaybackAdvanceResult =
  | { done: true }
  | {
      done: false;
      stepIndex: number;
      elapsedBeats: number;
      stepChanged: boolean;
    };

/**
 * Pure reducer for one beat tick of routine playback. The caller re-applies
 * root/scale/bpm/timeSig only when `stepChanged` is true, and stops playback
 * entirely when `done` is true.
 */
export function advancePlaybackBeat({
  steps,
  stepIndex,
  elapsedBeats,
}: {
  steps: RoutineScaleBlock[];
  stepIndex: number;
  elapsedBeats: number;
}): PlaybackAdvanceResult {
  const currentStep = steps[stepIndex];
  if (!currentStep) return { done: true };

  const nextElapsed = elapsedBeats + 1;
  if (nextElapsed < currentStep.beats) {
    return {
      done: false,
      stepIndex,
      elapsedBeats: nextElapsed,
      stepChanged: false,
    };
  }

  const nextIndex = stepIndex + 1;
  if (nextIndex >= steps.length) return { done: true };

  return {
    done: false,
    stepIndex: nextIndex,
    elapsedBeats: 0,
    stepChanged: true,
  };
}
