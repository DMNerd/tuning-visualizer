import React, { useMemo } from "react";

function HotkeysCheatsheet({ onClose }) {
  const rows = useMemo(
    () => [
      ["F1", "show this help"],
      ["f", "fullscreen"],
      ["l", "cycle labels"],
      ["o", "toggle open notes"],
      ["n", "toggle fret numbers"],
      ["d", "color by degree"],
      ["a", "sharps ↔ flats"],
      ["g", "left-handed layout"],
      ["c", "chord overlay"],
      ["h", "hide non-chord tones"],
      ["r", "randomise scale and root"],
      ["[ / ]", "strings - / +"],
      ["- / =", "frets - / +"],
      [", / .", "dot size - / +"],
    ],
    [],
  );

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
              <span className="tv-hotkeys__combo" key={`${alt}-${p}-${i}`}>
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
      <span className="tv-hotkeys__alt-wrap" key={`alt-${i}`}>
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
    <div className="tv-hotkeys" role="dialog" aria-label="Keyboard shortcuts">
      <div className="tv-hotkeys__title">
        <span>Hotkeys</span>
        {onClose ? (
          <button
            type="button"
            className="tv-hotkeys__close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        ) : null}
      </div>
      <ul className="tv-hotkeys__list">
        {rows.map(([keys, desc]) => (
          <li className="tv-hotkeys__row" key={keys}>
            <span className="tv-hotkeys__keys">{renderKeys(keys)}</span>
            <span className="tv-hotkeys__desc">{desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default React.memo(HotkeysCheatsheet);
