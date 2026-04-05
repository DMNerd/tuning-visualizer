import { memo, useMemo } from "react";
import clsx from "clsx";

function parseBeats(timeSig) {
  const beats = Number.parseInt(String(timeSig).split("/")[0], 10);
  return Number.isFinite(beats) && beats > 0 ? beats : 4;
}

function BeatIndicator({
  currentBeat = 1,
  currentBar = 1,
  timeSig = "4/4",
  isPlaying = false,
  className,
}) {
  const beatsPerBar = useMemo(() => parseBeats(timeSig), [timeSig]);

  return (
    <div
      className={clsx("tv-beat-indicator", className, {
        "is-playing": isPlaying,
      })}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="tv-beat-indicator__meta">
        <span>Bar {currentBar}</span>
        <span aria-hidden>•</span>
        <span>
          Beat {currentBeat}/{beatsPerBar}
        </span>
      </div>
      <div className="tv-beat-indicator__beats" aria-hidden>
        {Array.from({ length: beatsPerBar }, (_, i) => {
          const beat = i + 1;
          return (
            <span
              key={beat}
              className={clsx("tv-beat-indicator__dot", {
                "is-active": beat === currentBeat,
              })}
            />
          );
        })}
      </div>
    </div>
  );
}

export default memo(BeatIndicator);
