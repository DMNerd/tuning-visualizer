import { lazy } from "react";
import SafeLazyModal from "@shared/ui/SafeLazyModal";

const TuningPackEditorModal = lazy(
  () => import("@features/export/components/TuningPackEditorModal"),
);
const TuningPackManagerModal = lazy(
  () => import("@features/export/components/TuningPackManagerModal"),
);

export default function CustomTuningModalsContainer({
  modal,
  customTunings,
  systems,
  themeMode,
  handlers,
}) {
  return (
    <>
      <SafeLazyModal
        isOpen={Boolean(modal.editorState)}
        resetKeys={[modal.editorState]}
        label="editor"
      >
        <TuningPackEditorModal
          isOpen={Boolean(modal.editorState)}
          mode={modal.editorState?.mode ?? "create"}
          initialPack={modal.editorState?.initialPack}
          originalName={modal.editorState?.originalName ?? undefined}
          onCancel={handlers.cancelEditor}
          onSubmit={handlers.submitEditor}
          themeMode={themeMode}
        />
      </SafeLazyModal>
      <SafeLazyModal
        isOpen={modal.isManagerOpen}
        resetKeys={[modal.isManagerOpen]}
        label="manager"
      >
        <TuningPackManagerModal
          isOpen={modal.isManagerOpen}
          tunings={customTunings}
          systems={systems}
          themeMode={themeMode}
          onClose={handlers.closeManager}
          onEdit={handlers.editFromManager}
          onDelete={handlers.deletePack}
        />
      </SafeLazyModal>
    </>
  );
}
