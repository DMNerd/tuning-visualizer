import { memo } from "react";
import { useTranslation } from "react-i18next";

// [keys, translation key of the description]
const HOTKEY_ROWS = [
  ["Shift+/ • Ctrl+/ • F1", "hotkeys.help"],
  ["f", "hotkeys.fullscreen"],
  ["l", "hotkeys.cycleLabels"],
  ["o", "hotkeys.openNotes"],
  ["n", "hotkeys.fretNumbers"],
  ["d", "hotkeys.colorByDegree"],
  ["a", "hotkeys.accidentals"],
  ["g", "hotkeys.lefty"],
  ["c", "hotkeys.chordOverlay"],
  ["h", "hotkeys.hideNonChord"],
  ["r", "hotkeys.randomize"],
  ["m • Space", "hotkeys.metronome"],
  ["Alt+[ / Alt+] • ArrowDown / ArrowUp", "hotkeys.bpm"],
  ["t • Enter", "hotkeys.tapTempo"],
  ["[ / ]", "hotkeys.strings"],
  ["- / =", "hotkeys.frets"],
  [", / .", "hotkeys.dotSize"],
  ["Ctrl+N • Cmd+N", "hotkeys.newPack"],
];

function HotkeysCheatsheet({ onClose }) {
  const { t } = useTranslation();
  const renderKeys = (text) => {
    const alts = text
      .split("•")
      .map((s) => s.trim())
      .filter(Boolean);

    const renderAlt = (alt) => {
      if (alt.includes(" / ")) {
        const pair = alt.split(" / ").map((s) => s.trim());
        return (
          <span className="tv-hotkeys__alt" key={alt}>
            <kbd>{pair[0]}</kbd>
            <span className="tv-hotkeys__sep" aria-hidden="true">
              {" "}
              /{" "}
            </span>
            <kbd>{pair[1]}</kbd>
          </span>
        );
      }
      if (alt.includes("+")) {
        const parts = alt.split("+").map((s) => s.trim());
        return (
          <span className="tv-hotkeys__alt" key={alt}>
            {parts.map((p, i) => (
              <span className="tv-hotkeys__combo" key={p}>
                <kbd>{p}</kbd>
                {i < parts.length - 1 ? (
                  <span className="tv-hotkeys__sep" aria-hidden="true">
                    {" "}
                    +{" "}
                  </span>
                ) : null}
              </span>
            ))}
          </span>
        );
      }
      return (
        <span className="tv-hotkeys__alt" key={alt}>
          <kbd>{alt}</kbd>
        </span>
      );
    };

    return alts.map((alt, i) => (
      <span className="tv-hotkeys__alt-wrap" key={alt}>
        {renderAlt(alt)}
        {i < alts.length - 1 ? (
          <span className="tv-hotkeys__sep" aria-hidden="true">
            {" "}
            •{" "}
          </span>
        ) : null}
      </span>
    ));
  };

  return (
    <div className="tv-hotkeys" role="dialog" aria-label={t("hotkeys.dialog")}>
      <div className="tv-hotkeys__title">
        <span>{t("hotkeys.title")}</span>
        {onClose ? (
          <button
            type="button"
            className="tv-hotkeys__close"
            aria-label={t("common.close")}
            onClick={onClose}
          >
            ×
          </button>
        ) : null}
      </div>
      <ul className="tv-hotkeys__list">
        {HOTKEY_ROWS.map(([keys, descKey]) => (
          <li className="tv-hotkeys__row" key={keys}>
            <span className="tv-hotkeys__keys">{renderKeys(keys)}</span>
            <span className="tv-hotkeys__desc">{t(descKey)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default memo(HotkeysCheatsheet);
