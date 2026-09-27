import test from "node:test";
import assert from "node:assert/strict";

import {
  MemoryStorage,
  importFresh,
  rehydrateFresh,
} from "../../helpers/storeTestUtils.js";

import { STORAGE_KEYS } from "@shared/lib/storage/storageKeys";

const storage = new MemoryStorage();
const sessionStorage = new MemoryStorage();
globalThis.localStorage = storage;
globalThis.sessionStorage = sessionStorage;

// Clears storage and returns a freshly imported (empty) routine store.
async function freshRoutineStore() {
  storage.clear();
  const { useTrainingRoutineStore } = await importFresh(
    "@features/training/store/useTrainingRoutineStore.js",
  );
  return useTrainingRoutineStore;
}

function readStoredJson(key) {
  const raw = storage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

test("upsertRoutine inserts new and updates existing by id", async () => {
  const useTrainingRoutineStore = await freshRoutineStore();

  useTrainingRoutineStore.getState().upsertRoutine({ id: "r1", name: "First" });
  useTrainingRoutineStore
    .getState()
    .upsertRoutine({ id: "r2", name: "Second" });
  useTrainingRoutineStore
    .getState()
    .upsertRoutine({ id: "r1", name: "First (updated)" });

  const { routines } = useTrainingRoutineStore.getState();
  assert.equal(routines.length, 2);
  assert.equal(routines.find((r) => r.id === "r1").name, "First (updated)");
  assert.equal(routines.find((r) => r.id === "r2").name, "Second");
});

test("renameRoutine updates name and updatedAt", async () => {
  const useTrainingRoutineStore = await freshRoutineStore();

  useTrainingRoutineStore
    .getState()
    .upsertRoutine({ id: "r1", name: "Old", updatedAt: 1 });
  useTrainingRoutineStore.getState().renameRoutine("r1", "New name");

  const routine = useTrainingRoutineStore
    .getState()
    .routines.find((r) => r.id === "r1");
  assert.equal(routine.name, "New name");
  assert.notEqual(routine.updatedAt, 1);
});

test("removeRoutine removes by id", async () => {
  const useTrainingRoutineStore = await freshRoutineStore();

  useTrainingRoutineStore.getState().upsertRoutine({ id: "r1", name: "First" });
  useTrainingRoutineStore
    .getState()
    .upsertRoutine({ id: "r2", name: "Second" });
  useTrainingRoutineStore.getState().removeRoutine("r1");

  const { routines } = useTrainingRoutineStore.getState();
  assert.equal(routines.length, 1);
  assert.equal(routines[0].id, "r2");
});

test("routines persist under STORAGE_KEYS.TRAINING_ROUTINES and rehydrate", async () => {
  const useTrainingRoutineStore = await freshRoutineStore();

  useTrainingRoutineStore
    .getState()
    .upsertRoutine({ id: "r1", name: "Persisted routine" });

  const persisted = readStoredJson(STORAGE_KEYS.TRAINING_ROUTINES);
  assert.equal(Array.isArray(persisted?.state?.routines), true);
  assert.equal(persisted.state.routines[0].name, "Persisted routine");

  const reloadedStore = await rehydrateFresh(
    "@features/training/store/useTrainingRoutineStore.js",
    "useTrainingRoutineStore",
  );
  assert.equal(reloadedStore.getState().routines[0].name, "Persisted routine");
});

test("resetTrainingRoutines clears the list", async () => {
  const useTrainingRoutineStore = await freshRoutineStore();

  useTrainingRoutineStore.getState().upsertRoutine({ id: "r1", name: "First" });
  useTrainingRoutineStore.getState().resetTrainingRoutines();

  assert.deepEqual(useTrainingRoutineStore.getState().routines, []);
});
