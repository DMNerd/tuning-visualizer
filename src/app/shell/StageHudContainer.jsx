import StageHud from "@app/shell/StageHud";
import {
  selectMetronomePrefs,
  useMetronomePlaybackStatus,
  useMetronomePrefsStore,
  useMetronomeTickCursor,
} from "@features/practice";

export default function StageHudContainer({
  isFs,
  onToggleFs,
  onResetAll,
  showPracticeHud,
}) {
  const { currentBeat, currentBar } = useMetronomeTickCursor();
  const { isPlaying, audioReady, audioError, practiceSecondsRemaining } =
    useMetronomePlaybackStatus();

  const timeSig = useMetronomePrefsStore(
    (state) => selectMetronomePrefs(state).timeSig,
  );
  const countInEnabled = useMetronomePrefsStore(
    (state) => selectMetronomePrefs(state).countInEnabled,
  );
  const timedPracticeEnabled = useMetronomePrefsStore(
    (state) => selectMetronomePrefs(state).timedPracticeEnabled,
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
      timedPracticeEnabled={timedPracticeEnabled}
      practiceSecondsRemaining={practiceSecondsRemaining}
      audioReady={audioReady}
      audioError={audioError}
    />
  );
}
