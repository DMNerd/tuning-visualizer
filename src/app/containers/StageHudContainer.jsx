import StageHud from "@/components/UI/StageHud";
import {
  useMetronomeEngineStore,
  selectMetronomeCurrentBeat,
  selectMetronomeCurrentBar,
  selectMetronomeIsPlaying,
  selectMetronomeAudioReady,
  selectMetronomeAudioError,
} from "@/stores/useMetronomeEngineStore";
import {
  useMetronomePrefsStore,
  selectMetronomePrefs,
} from "@/stores/useMetronomePrefsStore";

export default function StageHudContainer({
  isFs,
  onToggleFs,
  onResetAll,
  showPracticeHud,
}) {
  const currentBeat = useMetronomeEngineStore(selectMetronomeCurrentBeat);
  const currentBar = useMetronomeEngineStore(selectMetronomeCurrentBar);
  const isPlaying = useMetronomeEngineStore(selectMetronomeIsPlaying);
  const audioReady = useMetronomeEngineStore(selectMetronomeAudioReady);
  const audioError = useMetronomeEngineStore(selectMetronomeAudioError);

  const timeSig = useMetronomePrefsStore((state) =>
    selectMetronomePrefs(state).timeSig,
  );
  const countInEnabled = useMetronomePrefsStore((state) =>
    selectMetronomePrefs(state).countInEnabled,
  );

  return (
    <StageHud
      isFs={isFs}
      onToggleFs={onToggleFs}
      onResetAll={onResetAll}
      showPracticeHud={showPracticeHud}
      currentBeat={currentBeat}
      currentBar={currentBar}
      timeSig={timeSig}
      isPlaying={isPlaying}
      countInEnabled={countInEnabled}
      audioReady={audioReady}
      audioError={audioError}
    />
  );
}
