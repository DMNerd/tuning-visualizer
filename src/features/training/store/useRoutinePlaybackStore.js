import { create } from "zustand";

// Ephemeral, session-only playback state — not persisted, matching
// useMetronomeEngineStore.js (runtime engine state, not user data).
const INITIAL_PLAYBACK_STATE = {
  activeRoutine: null,
  stepIndex: 0,
  elapsedBeats: 0,
  isPaused: false,
  // Full teardown (unsubscribe beat listener, restore autoAdvance, stop the
  // shared engine, clear this store) for the in-progress session, registered
  // by useRoutinePlayback.play(). Lets other features that can also stop the
  // shared engine (e.g. Practice's Start/Stop button) end a routine properly
  // instead of yanking the engine out from under it and leaving this store
  // stuck on a routine that no longer has any audio driving it.
  requestStop: null,
};

export const useRoutinePlaybackStore = create((set) => ({
  ...INITIAL_PLAYBACK_STATE,

  beginRoutine: (routine, requestStop) =>
    set({
      activeRoutine: routine,
      stepIndex: 0,
      elapsedBeats: 0,
      isPaused: false,
      requestStop: requestStop ?? null,
    }),

  setProgress: (stepIndex, elapsedBeats) => set({ stepIndex, elapsedBeats }),

  setPaused: (isPaused) => set({ isPaused: Boolean(isPaused) }),

  clear: () => set(INITIAL_PLAYBACK_STATE),
}));

export const selectRoutinePlaybackState = (state) => ({
  activeRoutine: state.activeRoutine,
  stepIndex: state.stepIndex,
  elapsedBeats: state.elapsedBeats,
  isPaused: state.isPaused,
});

// Single-field selectors for consumers (like the builder modal) that only
// need to know *whether*/*what* is playing, not live per-beat progress —
// subscribing to the full state above would re-render on every beat tick.
export const selectActiveRoutine = (state) => state.activeRoutine;
export const selectIsRoutinePlaying = (state) => Boolean(state.activeRoutine);
