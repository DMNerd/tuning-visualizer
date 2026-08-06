import { useShallow } from "zustand/react/shallow";
import RoutineHud from "@features/training/components/RoutineHud";
import {
  useRoutinePlaybackStore,
  selectRoutinePlaybackState,
} from "@features/training/store/useRoutinePlaybackStore";

export default function RoutineHudContainer({
  routinePlayback,
  accidental,
  noteNaming,
}) {
  const { activeRoutine, stepIndex, elapsedBeats, isPaused } =
    useRoutinePlaybackStore(useShallow(selectRoutinePlaybackState));

  if (!activeRoutine) return null;

  return (
    <RoutineHud
      routine={activeRoutine}
      stepIndex={stepIndex}
      elapsedBeats={elapsedBeats}
      isPaused={isPaused}
      onPause={routinePlayback.pause}
      onResume={routinePlayback.resume}
      onStop={routinePlayback.stop}
      accidental={accidental}
      noteNaming={noteNaming}
    />
  );
}
