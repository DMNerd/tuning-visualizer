import { useShallow } from "zustand/react/shallow";
import {
  useTrainingRoutineStore,
  selectTrainingRoutinesList,
  selectTrainingRoutinesIsHydrated,
  selectTrainingRoutinesActions,
} from "@features/training/store/useTrainingRoutineStore";

export function useTrainingRoutines() {
  const routines = useTrainingRoutineStore(selectTrainingRoutinesList);
  const isHydrated = useTrainingRoutineStore(selectTrainingRoutinesIsHydrated);
  const { upsertRoutine, renameRoutine, removeRoutine } = useTrainingRoutineStore(
    useShallow(selectTrainingRoutinesActions),
  );

  return { routines, isHydrated, upsertRoutine, renameRoutine, removeRoutine };
}
