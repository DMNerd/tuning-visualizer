import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const INITIAL_ENGINE_STATE = {
  isPlaying: false,
  currentBeat: 1,
  currentBar: 1,
  audioReady: false,
  audioError: "",
};

export const useMetronomeEngineStore = create(
  immer((set) => ({
    ...INITIAL_ENGINE_STATE,
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setCurrentBeat: (currentBeat) => set({ currentBeat }),
    setCurrentBar: (currentBar) => set({ currentBar }),
    setCursor: ({ currentBeat, currentBar }) => set({ currentBeat, currentBar }),
    setAudioReady: (audioReady) => set({ audioReady }),
    setAudioError: (audioError) => set({ audioError }),
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
      }),
  })),
);

export const selectMetronomeEngineState = (state) => ({
  isPlaying: state.isPlaying,
  currentBeat: state.currentBeat,
  currentBar: state.currentBar,
  audioReady: state.audioReady,
  audioError: state.audioError,
});

export const selectMetronomeEngineActions = (state) => ({
  setIsPlaying: state.setIsPlaying,
  setCurrentBeat: state.setCurrentBeat,
  setCurrentBar: state.setCurrentBar,
  setCursor: state.setCursor,
  setAudioReady: state.setAudioReady,
  setAudioError: state.setAudioError,
  resetCursorState: state.resetCursorState,
  resetPlaybackState: state.resetPlaybackState,
});

export const selectMetronomeIsPlaying = (state) => state.isPlaying;
export const selectMetronomeCurrentBeat = (state) => state.currentBeat;
export const selectMetronomeCurrentBar = (state) => state.currentBar;
export const selectMetronomeAudioReady = (state) => state.audioReady;
export const selectMetronomeAudioError = (state) => state.audioError;
