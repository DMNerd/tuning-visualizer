import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const INITIAL_ENGINE_STATE = {
  isPlaying: false,
  currentBeat: 1,
  currentBar: 1,
  audioReady: false,
  audioError: "",
  practiceSecondsRemaining: null,
};

export const useMetronomeEngineStore = create(
  immer((set) => ({
    ...INITIAL_ENGINE_STATE,
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setCurrentBeat: (currentBeat) => set({ currentBeat }),
    setCurrentBar: (currentBar) => set({ currentBar }),
    setCursor: ({ currentBeat, currentBar }) =>
      set({ currentBeat, currentBar }),
    setAudioReady: (audioReady) => set({ audioReady }),
    setAudioError: (audioError) => set({ audioError }),
    setPracticeSecondsRemaining: (practiceSecondsRemaining) =>
      set({ practiceSecondsRemaining }),
    resetCursorState: () =>
      set({
        currentBeat: INITIAL_ENGINE_STATE.currentBeat,
        currentBar: INITIAL_ENGINE_STATE.currentBar,
      }),
    resetPlaybackState: () =>
      set({
        isPlaying: INITIAL_ENGINE_STATE.isPlaying,
        currentBeat: INITIAL_ENGINE_STATE.currentBeat,
        currentBar: INITIAL_ENGINE_STATE.currentBar,
        practiceSecondsRemaining: INITIAL_ENGINE_STATE.practiceSecondsRemaining,
      }),
  })),
);

export const selectMetronomeEngineState = (state) => ({
  isPlaying: state.isPlaying,
  currentBeat: state.currentBeat,
  currentBar: state.currentBar,
  audioReady: state.audioReady,
  audioError: state.audioError,
  practiceSecondsRemaining: state.practiceSecondsRemaining,
});
export const selectMetronomeEnginePlaybackState = (state) => ({
  isPlaying: state.isPlaying,
  audioReady: state.audioReady,
  audioError: state.audioError,
  practiceSecondsRemaining: state.practiceSecondsRemaining,
});
export const selectMetronomeEngineCursorState = (state) => ({
  currentBeat: state.currentBeat,
  currentBar: state.currentBar,
});

export const selectMetronomeEngineActions = (state) => ({
  setIsPlaying: state.setIsPlaying,
  setCurrentBeat: state.setCurrentBeat,
  setCurrentBar: state.setCurrentBar,
  setCursor: state.setCursor,
  setAudioReady: state.setAudioReady,
  setAudioError: state.setAudioError,
  setPracticeSecondsRemaining: state.setPracticeSecondsRemaining,
  resetCursorState: state.resetCursorState,
  resetPlaybackState: state.resetPlaybackState,
});

export const selectMetronomeIsPlaying = (state) => state.isPlaying;
export const selectMetronomeCurrentBeat = (state) => state.currentBeat;
export const selectMetronomeCurrentBar = (state) => state.currentBar;
export const selectMetronomeAudioReady = (state) => state.audioReady;
export const selectMetronomeAudioError = (state) => state.audioError;
export const selectMetronomePracticeSecondsRemaining = (state) =>
  state.practiceSecondsRemaining;
