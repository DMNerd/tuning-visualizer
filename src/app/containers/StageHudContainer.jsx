import StageHud from "@/components/UI/StageHud";
import {
  useMetronomePlaybackStatus,
  useMetronomeTickCursor,
} from "@/hooks/useMetronomeEngine";
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
  const { currentBeat, currentBar } = useMetronomeTickCursor();
  const { isPlaying, audioReady, audioError } = useMetronomePlaybackStatus();

  const timeSig = useMetronomePrefsStore(
    (state) => selectMetronomePrefs(state).timeSig,
  );
  const countInEnabled = useMetronomePrefsStore(
    (state) => selectMetronomePrefs(state).countInEnabled,
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
