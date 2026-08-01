import { create } from "zustand";

// Ephemeral, session-only playback state — not persisted, matching
// useMetronomeEngineStore.js (runtime engine state, not user data).
const INITIAL_PLAYBACK_STATE = {
  activeRoutine: null,
  stepIndex: 0,
  elapsedBeats: 0,
  isPaused: false,
};

export const useRoutinePlaybackStore = create((set) => ({
  ...INITIAL_PLAYBACK_STATE,

  beginRoutine: (routine) =>
    set({
      activeRoutine: routine,
      stepIndex: 0,
      elapsedBeats: 0,
      isPaused: false,
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
