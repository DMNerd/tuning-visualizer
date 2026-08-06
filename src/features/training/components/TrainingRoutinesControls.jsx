import { useCallback, useState } from "react";
import RoutineBuilderModal from "@features/training/components/RoutineBuilderModal";
import { useTrainingRoutineUrlHydration } from "@features/training/hooks/useTrainingRoutineUrlHydration";

export default function TrainingRoutinesControls({
  routinePlayback,
  liveDefaults,
}) {
  const [isBuilderOpen, setBuilderOpen] = useState(false);
  const [importedRoutine, setImportedRoutine] = useState(null);

  const onRoutineImported = useCallback((routine) => {
    setImportedRoutine(routine);
    setBuilderOpen(true);
  }, []);

  useTrainingRoutineUrlHydration({ onRoutineImported });

  return (
    <div id="training-routines-controls">
      <h3 className="tv-panel__subtitle">Training Routine</h3>
      <div className="tv-controls tv-controls--training">
        <button
          type="button"
          className="tv-button tv-button--block"
          onClick={() => setBuilderOpen(true)}
        >
          Open routine builder
        </button>
      </div>
      <RoutineBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setBuilderOpen(false)}
        initialRoutine={importedRoutine}
        onConsumedInitialRoutine={() => setImportedRoutine(null)}
        routinePlayback={routinePlayback}
        liveDefaults={liveDefaults}
      />
    </div>
  );
}
