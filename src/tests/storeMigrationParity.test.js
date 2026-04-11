import test from "node:test";
import assert from "node:assert/strict";

import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { scopeKey } from "@/lib/storage/windowScope";

class MemoryStorage {
  constructor() {
    this.map = new Map();
    this.setItemCounts = new Map();
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.map.set(key, String(value));
    this.setItemCounts.set(key, (this.setItemCounts.get(key) || 0) + 1);
  }

  removeItem(key) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
    this.setItemCounts.clear();
  }

  getSetItemCount(key) {
    return this.setItemCounts.get(key) || 0;
  }
}

const storage = new MemoryStorage();
const sessionStorage = new MemoryStorage();
globalThis.localStorage = storage;
globalThis.sessionStorage = sessionStorage;

function setActiveWindowId(windowId) {
  if (windowId === null) {
    sessionStorage.removeItem("tv.windowId");
    delete globalThis.__TV_WINDOW_ID__;
    return;
  }
  sessionStorage.setItem("tv.windowId", windowId);
  globalThis.__TV_WINDOW_ID__ = windowId;
}

async function importFresh(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  return import(`${url.href}?t=${Date.now()}-${Math.random()}`);
}

function readStoredJson(key) {
  const raw = storage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

function scopedKeyForWindow(baseKey, windowId) {
  return `${baseKey}:${windowId}`;
}

test("legacy metronome prefs shape hydrates into normalized prefs store shape", async () => {
  storage.clear();
  storage.setItem(
    STORAGE_KEYS.METRONOME_PREFS,
    JSON.stringify({
      bpm: 97,
      timeSig: "3/4",
      autoAdvanceEnabled: true,
      randomizeMode: "invalid-mode",
    }),
  );

  const { useMetronomePrefsStore } = await importFresh(
    "../stores/useMetronomePrefsStore.js",
  );

  await useMetronomePrefsStore.persist.rehydrate();
  const state = useMetronomePrefsStore.getState();

  assert.equal(state.prefs.bpm, 97);
  assert.equal(state.prefs.timeSig, "3/4");
  assert.equal(state.prefs.autoAdvanceEnabled, true);
  assert.equal(state.randomizeMode, "both");
  assert.equal(typeof state.setters.setBpm, "function");
  assert.equal(typeof state.setters.setTimeSig, "function");

  const persisted = readStoredJson(STORAGE_KEYS.METRONOME_PREFS);
  assert.equal(typeof persisted, "object");
  assert.equal(typeof persisted?.state, "object");
  assert.equal(typeof persisted?.state?.prefs, "object");
  assert.equal(persisted?.state?.prefs?.bpm, 97);
});

test("metronome store falls back for invalid persisted randomizeMode", async () => {
  storage.clear();
  storage.setItem(
    STORAGE_KEYS.METRONOME_PREFS,
    JSON.stringify({
      state: {
        prefs: { bpm: 101, timeSig: "4/4" },
        randomizeMode: "not-real",
      },
      version: 1,
    }),
  );

  const { useMetronomePrefsStore } = await importFresh(
    "../stores/useMetronomePrefsStore.js",
  );

  await useMetronomePrefsStore.persist.rehydrate();
  const state = useMetronomePrefsStore.getState();
  assert.equal(state.prefs.bpm, 101);
  assert.equal(state.randomizeMode, "both");
});

test("legacy theory keys hydrate into new theory store and clear old keys", async () => {
  storage.clear();
  storage.setItem(STORAGE_KEYS.SYSTEM_ID, "24-TET");
  storage.setItem(STORAGE_KEYS.ROOT, "D");

  const { useTheoryStore } = await importFresh("../stores/useTheoryStore.js");

  await useTheoryStore.persist.rehydrate();
  const state = useTheoryStore.getState();

  assert.equal(state.systemId, "24-TET");
  assert.equal(state.root, "D");
  assert.equal(storage.getItem(STORAGE_KEYS.SYSTEM_ID), null);
  assert.equal(storage.getItem(STORAGE_KEYS.ROOT), null);
});

test("theory store prefers valid persisted payload over legacy keys", async () => {
  storage.clear();
  storage.setItem(
    STORAGE_KEYS.THEORY_PREFS,
    JSON.stringify({
      state: { systemId: "19-TET", root: "F#" },
      version: 1,
    }),
  );
  storage.setItem(STORAGE_KEYS.SYSTEM_ID, "24-TET");
  storage.setItem(STORAGE_KEYS.ROOT, "D");

  const { useTheoryStore } = await importFresh("../stores/useTheoryStore.js");

  await useTheoryStore.persist.rehydrate();
  const state = useTheoryStore.getState();

  assert.equal(state.systemId, "19-TET");
  assert.equal(state.root, "F#");
  assert.equal(storage.getItem(STORAGE_KEYS.SYSTEM_ID), null);
  assert.equal(storage.getItem(STORAGE_KEYS.ROOT), null);
});

test("legacy custom tuning payload array remains compatible in workflow store", async () => {
  storage.clear();
  const legacyPayload = [
    { name: "Custom 1", system: { edo: 12 }, tuning: { strings: [] } },
  ];
  storage.setItem(STORAGE_KEYS.CUSTOM_TUNINGS, JSON.stringify(legacyPayload));

  const { useInstrumentWorkflowStore } = await importFresh(
    "../stores/useInstrumentWorkflowStore.js",
  );

  await useInstrumentWorkflowStore.persist.rehydrate();
  const state = useInstrumentWorkflowStore.getState();

  assert.equal(Array.isArray(state.customTunings), true);
  assert.equal(state.customTunings.length, 1);
  assert.equal(state.customTunings[0].name, "Custom 1");

  const persisted = readStoredJson(STORAGE_KEYS.CUSTOM_TUNINGS);
  assert.equal(typeof persisted, "object");
  assert.equal(Array.isArray(persisted?.state?.customTunings), true);
  assert.equal(persisted?.state?.customTunings?.[0]?.name, "Custom 1");
});

test("instrument core migration clamps strings/frets and reset action restores factory values", async () => {
  storage.clear();
  storage.setItem(STORAGE_KEYS.STRINGS, "100");
  storage.setItem(STORAGE_KEYS.FRETS, "1");

  const { useInstrumentCoreStore } = await importFresh(
    "../stores/useInstrumentCoreStore.js",
  );

  await useInstrumentCoreStore.persist.rehydrate();
  let state = useInstrumentCoreStore.getState();

  assert.equal(state.strings, 8);
  assert.equal(state.frets, 12);
  assert.equal(storage.getItem(STORAGE_KEYS.STRINGS), null);
  assert.equal(storage.getItem(STORAGE_KEYS.FRETS), null);
  assert.equal(storage.getItem(STORAGE_KEYS.USER_DEFAULT_TUNING), null);

  state.resetInstrumentPrefs(6, 24);
  state = useInstrumentCoreStore.getState();
  assert.equal(state.strings, 6);
  assert.equal(state.frets, 24);
  assert.equal(state.fretsTouched, false);
});

test("instrument core keeps global default tunings while using persisted strings/frets", async () => {
  storage.clear();
  storage.setItem(
    scopeKey(STORAGE_KEYS.INSTRUMENT_CORE),
    JSON.stringify({
      state: {
        strings: 7,
        frets: 22,
        userDefaultTuningMap: {
          "12-TET:7": ["A", "D", "G", "C", "E", "A", "D"],
        },
      },
      version: 1,
    }),
  );
  storage.setItem(STORAGE_KEYS.STRINGS, "8");
  storage.setItem(STORAGE_KEYS.FRETS, "12");
  storage.setItem(
    STORAGE_KEYS.USER_DEFAULT_TUNING,
    JSON.stringify({ legacy: ["E", "A", "D", "G", "B", "E"] }),
  );

  const { useInstrumentCoreStore } = await importFresh(
    "../stores/useInstrumentCoreStore.js",
  );

  await useInstrumentCoreStore.persist.rehydrate();
  const state = useInstrumentCoreStore.getState();

  assert.equal(state.strings, 7);
  assert.equal(state.frets, 22);
  assert.deepEqual(state.userDefaultTuningMap, {
    legacy: ["E", "A", "D", "G", "B", "E"],
  });
  assert.equal(storage.getItem(STORAGE_KEYS.STRINGS), null);
  assert.equal(storage.getItem(STORAGE_KEYS.FRETS), null);
  assert.notEqual(storage.getItem(STORAGE_KEYS.USER_DEFAULT_TUNING), null);
});

test("instrument core store preserves tuning/stringMeta/boardMeta mutation semantics", async () => {
  storage.clear();
  const { useInstrumentCoreStore } = await importFresh(
    "../stores/useInstrumentCoreStore.js",
  );

  useInstrumentCoreStore.setState({
    tuning: ["E", "A", "D", "G"],
    stringMeta: null,
    boardMeta: null,
  });
  useInstrumentCoreStore.getState().setTuning((draft) => {
    draft[0] = "D";
  });
  useInstrumentCoreStore.getState().setStringMeta([{ label: "Low" }]);
  useInstrumentCoreStore.getState().setBoardMeta({ title: "Drop D" });
  useInstrumentCoreStore.getState().updateStringMeta((draft) => {
    draft.push({ label: "High" });
  });
  useInstrumentCoreStore.getState().updateBoardMeta((draft) => {
    draft.title = "Drop D v2";
  });
  useInstrumentCoreStore.getState().updateUserDefaultTuningMap((draft) => {
    draft["12-TET:4"] = ["D", "A", "D", "G"];
  });

  const state = useInstrumentCoreStore.getState();
  assert.equal(state.tuning[0], "D");
  assert.deepEqual(state.stringMeta, [{ label: "Low" }, { label: "High" }]);
  assert.deepEqual(state.boardMeta, { title: "Drop D v2" });
  assert.deepEqual(state.userDefaultTuningMap["12-TET:4"], [
    "D",
    "A",
    "D",
    "G",
  ]);
  const globalDefaults = readStoredJson(STORAGE_KEYS.USER_DEFAULT_TUNING);
  assert.deepEqual(globalDefaults?.["12-TET:4"], ["D", "A", "D", "G"]);
});

test("instrument core avoids redundant global default tuning writes for no-op updates", async () => {
  storage.clear();
  const { useInstrumentCoreStore } = await importFresh(
    "../stores/useInstrumentCoreStore.js",
  );

  useInstrumentCoreStore.getState().updateUserDefaultTuningMap(() => {});
  useInstrumentCoreStore.getState().updateUserDefaultTuningMap(() => {});
  useInstrumentCoreStore.getState().setUserDefaultTuningMap((draft) => draft);
  assert.equal(storage.getSetItemCount(STORAGE_KEYS.USER_DEFAULT_TUNING), 0);

  useInstrumentCoreStore.getState().updateUserDefaultTuningMap((draft) => {
    draft["12-TET:6"] = ["E", "A", "D", "G", "B", "E"];
  });
  useInstrumentCoreStore.getState().updateUserDefaultTuningMap(() => {});
  assert.equal(storage.getSetItemCount(STORAGE_KEYS.USER_DEFAULT_TUNING), 1);
});

test("instrument core setTuning updater recovers from invalid tuning shape", async () => {
  storage.clear();
  const { useInstrumentCoreStore } = await importFresh(
    "../stores/useInstrumentCoreStore.js",
  );

  useInstrumentCoreStore.setState({ tuning: null });
  useInstrumentCoreStore.getState().setTuning((draft) => {
    draft[0] = "E";
    draft[1] = "A";
  });

  const state = useInstrumentCoreStore.getState();
  assert.deepEqual(state.tuning, ["E", "A"]);
});

test("instrument core migration defaults neckFilterMode to none when mode is absent", async () => {
  storage.clear();
  storage.setItem(
    scopeKey(STORAGE_KEYS.INSTRUMENT_CORE),
    JSON.stringify({
      state: {
        strings: 6,
        frets: 24,
      },
      version: 2,
    }),
  );

  const { useInstrumentCoreStore } = await importFresh(
    "../stores/useInstrumentCoreStore.js",
  );
  await useInstrumentCoreStore.persist.rehydrate();
  const state = useInstrumentCoreStore.getState();

  assert.equal(state.neckFilterMode, "none");
});

test("instrument core migration keeps explicit canonical neckFilterMode", async () => {
  storage.clear();
  storage.setItem(
    scopeKey(STORAGE_KEYS.INSTRUMENT_CORE),
    JSON.stringify({
      state: {
        strings: 6,
        frets: 24,
        neckFilterMode: "fretless",
      },
      version: 3,
    }),
  );

  const { useInstrumentCoreStore } = await importFresh(
    "../stores/useInstrumentCoreStore.js",
  );
  await useInstrumentCoreStore.persist.rehydrate();
  const state = useInstrumentCoreStore.getState();

  assert.equal(state.neckFilterMode, "fretless");
});

test("instrument core migration preserves explicit fretless neck filter mode", async () => {
  storage.clear();
  storage.setItem(
    scopeKey(STORAGE_KEYS.INSTRUMENT_CORE),
    JSON.stringify({
      state: {
        strings: 7,
        frets: 22,
        neckFilterMode: "fretless",
      },
      version: 3,
    }),
  );

  const { useInstrumentCoreStore } = await importFresh(
    "../stores/useInstrumentCoreStore.js",
  );
  await useInstrumentCoreStore.persist.rehydrate();
  const state = useInstrumentCoreStore.getState();

  assert.equal(state.neckFilterMode, "fretless");
});

test("instrument core setNeckFilterMode updates canonical mode", async () => {
  storage.clear();
  const { useInstrumentCoreStore } = await importFresh(
    "../stores/useInstrumentCoreStore.js",
  );

  useInstrumentCoreStore.getState().setNeckFilterMode("kg");
  let state = useInstrumentCoreStore.getState();
  assert.equal(state.neckFilterMode, "kg");

  useInstrumentCoreStore.getState().setNeckFilterMode("fretless");
  state = useInstrumentCoreStore.getState();
  assert.equal(state.neckFilterMode, "fretless");
});

test("display prefs store hydrates via globalThis localStorage adapter", async () => {
  storage.clear();
  sessionStorage.clear();
  storage.setItem(
    STORAGE_KEYS.DISPLAY_PREFS,
    JSON.stringify({
      state: { prefs: { accidental: "flat", dotSize: 28 } },
      version: 0,
    }),
  );

  const { useDisplayPrefsStore } = await importFresh(
    "../stores/useDisplayPrefsStore.js",
  );
  await useDisplayPrefsStore.persist.rehydrate();

  const state = useDisplayPrefsStore.getState();
  assert.equal(state.prefs.accidental, "flat");
  assert.equal(state.prefs.dotSize, 28);
});

test("global stores migrate scoped payloads back to unscoped keys", async () => {
  storage.clear();
  sessionStorage.clear();
  storage.setItem(
    scopeKey(STORAGE_KEYS.THEME),
    JSON.stringify({
      state: { theme: "dark" },
      version: 0,
    }),
  );

  const { useThemeStore } = await importFresh("../stores/useThemeStore.js");
  await useThemeStore.persist.rehydrate();

  const unscopedPersisted = readStoredJson(STORAGE_KEYS.THEME);
  assert.equal(useThemeStore.getState().theme, "dark");
  assert.equal(typeof unscopedPersisted, "object");
  assert.equal(unscopedPersisted?.state?.theme, "dark");
  assert.equal(storage.getItem(scopeKey(STORAGE_KEYS.THEME)), null);
});

test("value-or-updater setters preserve direct assignment and updater semantics", async () => {
  storage.clear();
  const { useDisplayPrefsStore } = await importFresh(
    "../stores/useDisplayPrefsStore.js",
  );
  const { useMetronomePrefsStore } = await importFresh(
    "../stores/useMetronomePrefsStore.js",
  );
  const { useInstrumentCoreStore } = await importFresh(
    "../stores/useInstrumentCoreStore.js",
  );

  useDisplayPrefsStore.getState().setPrefs({ accidental: "flat", dotSize: 20 });
  useDisplayPrefsStore.getState().setPrefs((draft) => {
    draft.dotSize = 26;
  });
  const display = useDisplayPrefsStore.getState().prefs;
  assert.equal(display.accidental, "flat");
  assert.equal(display.dotSize, 26);

  useMetronomePrefsStore.getState().setPrefs({
    bpm: 90,
    timeSig: "4/4",
    subdivision: 1,
    countInEnabled: false,
    autoAdvanceEnabled: false,
    barsPerScale: 4,
    announceCountInBeforeChange: true,
  });
  useMetronomePrefsStore.getState().setPrefs((draft) => {
    draft.bpm = 112;
  });
  const metronome = useMetronomePrefsStore.getState().prefs;
  assert.equal(metronome.bpm, 112);
  assert.equal(metronome.timeSig, "4/4");

  useInstrumentCoreStore.getState().setTuning(["E", "A", "D", "G"]);
  useInstrumentCoreStore.getState().setTuning((draft) => {
    draft[0] = "D";
  });
  const core = useInstrumentCoreStore.getState();
  assert.deepEqual(core.tuning, ["D", "A", "D", "G"]);
});

test("metronome prefs setters and engine reset semantics remain distinct", async () => {
  storage.clear();
  const { useMetronomePrefsStore } = await importFresh(
    "../stores/useMetronomePrefsStore.js",
  );
  const { useMetronomeEngineStore } = await importFresh(
    "../stores/useMetronomeEngineStore.js",
  );

  useMetronomePrefsStore.getState().setters.setBpm(132);
  useMetronomePrefsStore.getState().setters.setTimeSig("5/4");

  let prefs = useMetronomePrefsStore.getState().prefs;
  assert.equal(prefs.bpm, 132);
  assert.equal(prefs.timeSig, "5/4");

  useMetronomeEngineStore.setState({
    isPlaying: true,
    currentBeat: 3,
    currentBar: 2,
  });

  useMetronomeEngineStore.getState().resetCursorState();
  let engine = useMetronomeEngineStore.getState();
  assert.equal(engine.isPlaying, true);
  assert.equal(engine.currentBeat, 1);
  assert.equal(engine.currentBar, 1);

  useMetronomeEngineStore.getState().resetPlaybackState();
  engine = useMetronomeEngineStore.getState();
  assert.equal(engine.isPlaying, false);
  assert.equal(engine.currentBeat, 1);
  assert.equal(engine.currentBar, 1);

  useMetronomePrefsStore.getState().setRandomizeMode("key");
  useMetronomePrefsStore.getState().resetPrefs();
  prefs = useMetronomePrefsStore.getState().prefs;
  assert.equal(prefs.bpm, 80);
  assert.equal(prefs.timeSig, "4/4");
  assert.equal(useMetronomePrefsStore.getState().randomizeMode, "both");

  useMetronomePrefsStore.getState().setRandomizeMode("invalid");
  assert.equal(useMetronomePrefsStore.getState().randomizeMode, "both");
});

test("theory and workflow action names and behaviors remain stable", async () => {
  storage.clear();
  const { useTheoryStore } = await importFresh("../stores/useTheoryStore.js");
  const { useInstrumentWorkflowStore } = await importFresh(
    "../stores/useInstrumentWorkflowStore.js",
  );

  const theoryActions = useTheoryStore.getState();
  assert.equal(typeof theoryActions.setSystemId, "function");
  assert.equal(typeof theoryActions.setRoot, "function");
  assert.equal(typeof theoryActions.setScale, "function");
  assert.equal(typeof theoryActions.setChordRoot, "function");
  assert.equal(typeof theoryActions.setChordType, "function");
  assert.equal(typeof theoryActions.setShowChord, "function");
  assert.equal(typeof theoryActions.setHideNonChord, "function");

  theoryActions.setSystemId("24-TET");
  theoryActions.setRoot((prev) => (prev === "C" ? "D" : prev));
  theoryActions.setShowChord(true);
  theoryActions.setHideNonChord();
  const theoryState = useTheoryStore.getState();
  assert.equal(theoryState.systemId, "24-TET");
  assert.equal(theoryState.root, "D");
  assert.equal(theoryState.showChord, true);
  assert.equal(theoryState.hideNonChord, true);

  const workflowActions = useInstrumentWorkflowStore.getState();
  assert.equal(typeof workflowActions.setCustomTunings, "function");
  assert.equal(typeof workflowActions.updateCustomTunings, "function");
  assert.equal(typeof workflowActions.upsertCustomTuning, "function");
  assert.equal(typeof workflowActions.removeCustomTuning, "function");
  assert.equal(typeof workflowActions.setSelectedPreset, "function");
  assert.equal(typeof workflowActions.setQueuedPresetName, "function");
  assert.equal(typeof workflowActions.setEditorState, "function");
  assert.equal(typeof workflowActions.setManagerOpen, "function");
  assert.equal(typeof workflowActions.setPendingPresetName, "function");

  workflowActions.setCustomTunings([{ name: "Custom A" }]);
  workflowActions.setCustomTunings((draft) => {
    draft.push({ name: "Custom B" });
  });
  workflowActions.updateCustomTunings((draft) => {
    draft.push({ name: "Custom C", meta: { id: "custom-c" } });
    draft.push({ name: "NameOnly Pack" });
  });
  workflowActions.upsertCustomTuning({
    name: "Custom C+",
    meta: { id: "custom-c" },
  });
  workflowActions.removeCustomTuning("Custom A");
  workflowActions.removeCustomTuning({ name: "NameOnly Pack" });
  workflowActions.setSelectedPreset("Custom B");
  workflowActions.setQueuedPresetName("Custom B");
  workflowActions.setEditorState({ mode: "edit" });
  workflowActions.setManagerOpen(true);
  workflowActions.setPendingPresetName("Custom B");
  const workflowState = useInstrumentWorkflowStore.getState();
  assert.equal(workflowState.selectedPreset, "Custom B");
  assert.equal(workflowState.queuedPresetName, "Custom B");
  assert.deepEqual(workflowState.editorState, { mode: "edit" });
  assert.equal(workflowState.isManagerOpen, true);
  assert.equal(workflowState.pendingPresetName, "Custom B");
  assert.equal(workflowState.customTunings.length, 2);
  assert.equal(workflowState.customTunings[0].name, "Custom B");
  assert.equal(workflowState.customTunings[1].name, "Custom C+");
});

test("resetAllStores restores defaults and clears only app-owned keys", async () => {
  storage.clear();
  sessionStorage.clear();
  setActiveWindowId("window-main");
  storage.setItem("third.party", "keep-me");
  storage.setItem("tv.random", "keep-me-too");
  storage.setItem(STORAGE_KEYS.STRINGS, "8");
  storage.setItem(STORAGE_KEYS.FRETS, "24");
  storage.setItem(STORAGE_KEYS.SYSTEM_ID, "24-TET");
  storage.setItem(STORAGE_KEYS.ROOT, "D");
  storage.setItem(
    STORAGE_KEYS.USER_DEFAULT_TUNING,
    JSON.stringify({ "12-TET:6": ["E", "A", "D", "G", "B", "E"] }),
  );

  const { resetAllStores } = await importFresh("../stores/resetAllStores.js");
  const { useDisplayPrefsStore } =
    await import("../stores/useDisplayPrefsStore.js");
  const { useMetronomePrefsStore } =
    await import("../stores/useMetronomePrefsStore.js");
  const { useInstrumentCoreStore } =
    await import("../stores/useInstrumentCoreStore.js");
  const { useInstrumentWorkflowStore } =
    await import("../stores/useInstrumentWorkflowStore.js");
  const { useMetronomeEngineStore } =
    await import("../stores/useMetronomeEngineStore.js");
  const { useTheoryStore } = await import("../stores/useTheoryStore.js");
  const { useThemeStore } = await import("../stores/useThemeStore.js");

  useDisplayPrefsStore.getState().setPrefs({ accidental: "flat", dotSize: 20 });
  useMetronomePrefsStore.getState().setPrefs({ bpm: 132, timeSig: "5/4" });
  useMetronomePrefsStore.getState().setRandomizeMode("key");
  useMetronomeEngineStore.getState().setIsPlaying(true);
  useMetronomeEngineStore.getState().setCurrentBeat(3);
  useMetronomeEngineStore.getState().setCurrentBar(2);
  useInstrumentCoreStore.getState().setStrings(8);
  useInstrumentCoreStore.getState().setFrets(30);
  useInstrumentCoreStore.getState().setTuning(["D", "A", "D", "G", "A", "D"]);
  useInstrumentWorkflowStore
    .getState()
    .setCustomTunings([{ name: "Custom X" }]);
  useInstrumentWorkflowStore.getState().setManagerOpen(true);
  useTheoryStore.getState().setSystemId("24-TET");
  useTheoryStore.getState().setRoot("D");
  useThemeStore.getState().setTheme("dark");

  resetAllStores();

  assert.equal(useDisplayPrefsStore.getState().prefs.accidental, "sharp");
  assert.equal(useDisplayPrefsStore.getState().prefs.dotSize, 14);
  assert.equal(useMetronomePrefsStore.getState().prefs.bpm, 80);
  assert.equal(useMetronomePrefsStore.getState().prefs.timeSig, "4/4");
  assert.equal(useMetronomePrefsStore.getState().randomizeMode, "both");
  assert.equal(useMetronomeEngineStore.getState().isPlaying, false);
  assert.equal(useMetronomeEngineStore.getState().currentBeat, 1);
  assert.equal(useMetronomeEngineStore.getState().currentBar, 1);
  assert.equal(useInstrumentCoreStore.getState().strings, 6);
  assert.equal(useInstrumentCoreStore.getState().frets, 24);
  assert.deepEqual(useInstrumentCoreStore.getState().tuning, []);
  assert.deepEqual(useInstrumentWorkflowStore.getState().customTunings, []);
  assert.equal(useInstrumentWorkflowStore.getState().isManagerOpen, false);
  assert.equal(useTheoryStore.getState().systemId, "12-TET");
  assert.equal(useTheoryStore.getState().root, "C");
  assert.equal(useThemeStore.getState().theme, "auto");

  assert.equal(storage.getItem(STORAGE_KEYS.THEORY_PREFS), null);
  assert.equal(storage.getItem(scopeKey(STORAGE_KEYS.INSTRUMENT_CORE)), null);
  assert.equal(storage.getItem(STORAGE_KEYS.DISPLAY_PREFS), null);
  assert.equal(storage.getItem(STORAGE_KEYS.METRONOME_PREFS), null);
  assert.equal(storage.getItem(STORAGE_KEYS.THEME), null);
  assert.equal(storage.getItem(STORAGE_KEYS.CUSTOM_TUNINGS), null);
  assert.equal(storage.getItem(STORAGE_KEYS.STRINGS), null);
  assert.equal(storage.getItem(STORAGE_KEYS.FRETS), null);
  assert.equal(storage.getItem(STORAGE_KEYS.USER_DEFAULT_TUNING), null);
  assert.equal(storage.getItem(STORAGE_KEYS.SYSTEM_ID), null);
  assert.equal(storage.getItem(STORAGE_KEYS.ROOT), null);
  assert.equal(storage.getItem("third.party"), "keep-me");
  assert.equal(storage.getItem("tv.random"), "keep-me-too");
});

test("resetAllStores only clears instrument scoped keys for the active window", async () => {
  storage.clear();
  sessionStorage.clear();

  const windowA = "window-a";
  const windowB = "window-b";
  setActiveWindowId(windowA);

  storage.setItem(
    scopedKeyForWindow(STORAGE_KEYS.INSTRUMENT_CORE, windowA),
    JSON.stringify({ state: { strings: 7 }, version: 2 }),
  );
  storage.setItem(
    scopedKeyForWindow(STORAGE_KEYS.INSTRUMENT_CORE, windowB),
    JSON.stringify({ state: { strings: 5 }, version: 2 }),
  );
  storage.setItem(STORAGE_KEYS.DISPLAY_PREFS, JSON.stringify({ state: {} }));
  storage.setItem(STORAGE_KEYS.CUSTOM_TUNINGS, JSON.stringify({ state: [] }));

  const { resetAllStores } = await importFresh("../stores/resetAllStores.js");
  resetAllStores();

  assert.equal(
    storage.getItem(scopedKeyForWindow(STORAGE_KEYS.INSTRUMENT_CORE, windowA)),
    null,
  );
  assert.notEqual(
    storage.getItem(scopedKeyForWindow(STORAGE_KEYS.INSTRUMENT_CORE, windowB)),
    null,
  );
  assert.equal(storage.getItem(STORAGE_KEYS.DISPLAY_PREFS), null);
  assert.equal(storage.getItem(STORAGE_KEYS.CUSTOM_TUNINGS), null);
});

test("generated immer setters preserve non-target keys on full-store drafts", async () => {
  storage.clear();
  const { useTheoryStore } = await importFresh("../stores/useTheoryStore.js");
  const { useInstrumentWorkflowStore } = await importFresh(
    "../stores/useInstrumentWorkflowStore.js",
  );

  useTheoryStore.setState({ extraTheoryKey: "keep-me" });
  useTheoryStore.getState().setSystemId("24-TET");
  const theoryState = useTheoryStore.getState();
  assert.equal(theoryState.systemId, "24-TET");
  assert.equal(theoryState.extraTheoryKey, "keep-me");

  useInstrumentWorkflowStore.setState({ extraWorkflowKey: "keep-me-too" });
  useInstrumentWorkflowStore.getState().setSelectedPreset("Factory default");
  const workflowState = useInstrumentWorkflowStore.getState();
  assert.equal(workflowState.selectedPreset, "Factory default");
  assert.equal(workflowState.extraWorkflowKey, "keep-me-too");
});
