import { useCallback, useState } from "react";
import {
  createEmptyRoutine,
  createEmptyScaleBlock,
} from "@features/training/model/routine";

function touch(patch) {
  return { ...patch, updatedAt: Date.now() };
}

export function useRoutineDraft(initialRoutine) {
  const [draft, setDraft] = useState(() => initialRoutine ?? createEmptyRoutine());

  // patchFn receives the current draft and returns either a partial patch to
  // merge (with updatedAt bumped) or a falsy value to signal "no change".
  const patchDraft = useCallback((patchFn) => {
    setDraft((d) => {
      const patch = patchFn(d);
      return patch ? { ...d, ...touch(patch) } : d;
    });
  }, []);

  const loadDraft = useCallback((routine) => {
    setDraft(routine ?? createEmptyRoutine());
  }, []);

  const resetDraft = useCallback((systemId) => {
    setDraft(createEmptyRoutine(systemId));
  }, []);

  const renameDraft = useCallback(
    (name) => patchDraft(() => ({ name })),
    [patchDraft],
  );

  const setStartBlock = useCallback(
    (patch) =>
      patchDraft((d) => ({ startBlock: { ...d.startBlock, ...patch } })),
    [patchDraft],
  );

  const addScaleBlock = useCallback(
    () => patchDraft((d) => ({ steps: [...d.steps, createEmptyScaleBlock()] })),
    [patchDraft],
  );

  const updateScaleBlock = useCallback(
    (id, patch) =>
      patchDraft((d) => ({
        steps: d.steps.map((step) =>
          step.id === id ? { ...step, ...patch } : step,
        ),
      })),
    [patchDraft],
  );

  const removeScaleBlock = useCallback(
    (id) => patchDraft((d) => ({ steps: d.steps.filter((step) => step.id !== id) })),
    [patchDraft],
  );

  const moveScaleBlock = useCallback(
    (id, direction) =>
      patchDraft((d) => {
        const index = d.steps.findIndex((step) => step.id === id);
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (index < 0 || targetIndex < 0 || targetIndex >= d.steps.length) {
          return null;
        }
        const steps = [...d.steps];
        [steps[index], steps[targetIndex]] = [steps[targetIndex], steps[index]];
        return { steps };
      }),
    [patchDraft],
  );

  return {
    draft,
    loadDraft,
    resetDraft,
    renameDraft,
    setStartBlock,
    addScaleBlock,
    updateScaleBlock,
    removeScaleBlock,
    moveScaleBlock,
  };
}
