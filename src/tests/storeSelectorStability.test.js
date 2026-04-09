import test from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.map.set(key, String(value));
  }

  removeItem(key) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}

globalThis.localStorage = new MemoryStorage();

async function importFresh(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  return import(`${url.href}?t=${Date.now()}-${Math.random()}`);
}

function trackSelectorChanges(store, selector) {
  let selected = selector(store.getState());
  let changes = 0;
  const unsubscribe = store.subscribe((state) => {
    const next = selector(state);
    if (!Object.is(next, selected)) {
      selected = next;
      changes += 1;
    }
  });
  return {
    getChanges: () => changes,
    getSelected: () => selected,
    unsubscribe,
  };
}

test("metronome HUD selector ignores unrelated engine updates", async () => {
  const { useMetronomeEngineStore, selectMetronomeCurrentBeat } =
    await importFresh("../stores/useMetronomeEngineStore.js");
  useMetronomeEngineStore.setState({
    isPlaying: false,
    currentBeat: 1,
    currentBar: 1,
    audioReady: false,
    audioError: "",
  });

  const tracked = trackSelectorChanges(
    useMetronomeEngineStore,
    selectMetronomeCurrentBeat,
  );

  const state = useMetronomeEngineStore.getState();
  state.setAudioError("tap tempo unavailable");
  state.setAudioReady(true);
  state.setCurrentBeat(2);
  state.setCurrentBeat(2);

  assert.equal(tracked.getSelected(), 2);
  assert.equal(tracked.getChanges(), 1);
  tracked.unsubscribe();
});

test("metronome cursor updates beat/bar atomically", async () => {
  const {
    useMetronomeEngineStore,
    selectMetronomeCurrentBeat,
    selectMetronomeCurrentBar,
  } = await importFresh("../stores/useMetronomeEngineStore.js");

  useMetronomeEngineStore.setState({
    isPlaying: false,
    currentBeat: 1,
    currentBar: 1,
    audioReady: false,
    audioError: "",
  });

  const trackedBeat = trackSelectorChanges(
    useMetronomeEngineStore,
    selectMetronomeCurrentBeat,
  );
  const trackedBar = trackSelectorChanges(
    useMetronomeEngineStore,
    selectMetronomeCurrentBar,
  );

  useMetronomeEngineStore.getState().setCursor({ currentBeat: 2, currentBar: 3 });

  assert.equal(trackedBeat.getSelected(), 2);
  assert.equal(trackedBar.getSelected(), 3);
  assert.equal(trackedBeat.getChanges(), 1);
  assert.equal(trackedBar.getChanges(), 1);

  trackedBeat.unsubscribe();
  trackedBar.unsubscribe();
});


test("display controls selector only changes when selected pref changes", async () => {
  const { useDisplayPrefsStore } = await importFresh(
    "../stores/useDisplayPrefsStore.js",
  );
  useDisplayPrefsStore.setState((state) => ({
    ...state,
    prefs: {
      ...state.prefs,
      accidental: "sharp",
      dotSize: 22,
      showFretNums: true,
    },
  }));

  const tracked = trackSelectorChanges(
    useDisplayPrefsStore,
    (state) => state.prefs.accidental,
  );

  const { setters } = useDisplayPrefsStore.getState();
  setters.setDotSize(26);
  setters.setShowFretNums(false);
  setters.setAccidental("flat");
  setters.setAccidental("flat");

  assert.equal(tracked.getSelected(), "flat");
  assert.equal(tracked.getChanges(), 1);
  tracked.unsubscribe();
});

test("preset picker selector ignores workflow modal/editor updates", async () => {
  const { useInstrumentWorkflowStore, selectWorkflowSelectedPreset } =
    await importFresh("../stores/useInstrumentWorkflowStore.js");
  useInstrumentWorkflowStore.setState({
    customTunings: [],
    selectedPreset: "Factory default",
    queuedPresetName: null,
    editorState: null,
    isManagerOpen: false,
    pendingPresetName: null,
  });

  const tracked = trackSelectorChanges(
    useInstrumentWorkflowStore,
    selectWorkflowSelectedPreset,
  );

  const state = useInstrumentWorkflowStore.getState();
  state.setEditorState({ mode: "create" });
  state.setManagerOpen(true);
  state.setPendingPresetName("Drop D");
  state.setSelectedPreset("Drop D");
  state.setSelectedPreset("Drop D");

  assert.equal(tracked.getSelected(), "Drop D");
  assert.equal(tracked.getChanges(), 1);
  tracked.unsubscribe();
});
