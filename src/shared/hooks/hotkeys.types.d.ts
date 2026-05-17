export interface HotkeysLiveState {
  toggleFs?: () => void;
  setDisplayPrefs?: (updater: (draft: Record<string, unknown>) => void) => void;
  setFrets?: (value: number) => void;
  handleStringsChange?: (value: number) => void;
  setShowChord?: () => void;
  setHideNonChord?: () => void;
  strings?: number;
  frets?: number;
  onShowCheatsheet?: () => void;
  minStrings?: number;
  maxStrings?: number;
  minFrets?: number;
  maxFrets?: number;
  minDot?: number;
  maxDot?: number;
  labelValues?: string[];
  onRandomizeScale?: () => void;
  onCreateCustomPack?: () => void;
  practiceActions?: {
    randomizeScaleFromHotkey?: () => void;
    toggleMetronome?: () => void;
    bpmDown?: () => void;
    bpmUp?: () => void;
    tapTempo?: () => void;
  } | null;
  enabled?: boolean;
}

export interface HotkeysLiveRef {
  current: HotkeysLiveState;
}
