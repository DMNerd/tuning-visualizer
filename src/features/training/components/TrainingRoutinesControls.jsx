import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import RoutineBuilderModal from "@features/training/components/RoutineBuilderModal";
import { useTrainingRoutineUrlHydration } from "@features/training/hooks/useTrainingRoutineUrlHydration";

export default function TrainingRoutinesControls({
  routinePlayback,
  liveDefaults,
}) {
  const { t } = useTranslation();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [importedRoutine, setImportedRoutine] = useState(null);

  const onRoutineImported = useCallback((routine) => {
    setImportedRoutine(routine);
    setIsBuilderOpen(true);
  }, []);

  useTrainingRoutineUrlHydration({ onRoutineImported });

  return (
    <div id="training-routines-controls">
      <h3 className="tv-panel__subtitle">{t("training.sectionTitle")}</h3>
      <div className="tv-controls tv-controls--training">
        <button
          type="button"
          className="tv-button tv-button--block"
          onClick={() => setIsBuilderOpen(true)}
        >
          {t("training.openBuilder")}
        </button>
      </div>
      <RoutineBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        initialRoutine={importedRoutine}
        onConsumedInitialRoutine={() => setImportedRoutine(null)}
        routinePlayback={routinePlayback}
        liveDefaults={liveDefaults}
      />
    </div>
  );
}
