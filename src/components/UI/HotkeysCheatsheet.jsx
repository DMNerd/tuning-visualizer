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
      ["[ / ]", "strings - / +"],
      ["- / =", "frets - / +"],
      [", / .", "dot size - / +"],
    ],
    [],
  );

  const renderKeys = (text) => {
    const alts = text.split("•").map((s) => s.trim()).filter(Boolean);

    const renderAlt = (alt) => {
      if (alt.includes(" / ")) {
        const pair = alt.split(" / ").map((s) => s.trim());
        return (
          <span className="hk-alt" key={alt}>
            <kbd>{pair[0]}</kbd>
            <span className="hk-sep" aria-hidden="true"> / </span>
            <kbd>{pair[1]}</kbd>
          </span>
        );
      }
      if (alt.includes("+")) {
        const parts = alt.split("+").map((s) => s.trim());
        return (
          <span className="hk-alt" key={alt}>
            {parts.map((p, i) => (
              <span className="hk-combo" key={`${alt}-${p}-${i}`}>
                <kbd>{p}</kbd>
                {i < parts.length - 1 ? (
                  <span className="hk-sep" aria-hidden="true"> + </span>
                ) : null}
              </span>
            ))}
          </span>
        );
      }
      return (
        <span className="hk-alt" key={alt}>
          <kbd>{alt}</kbd>
        </span>
      );
    };

    return alts.map((alt, i) => (
      <span className="hk-alt-wrap" key={`alt-${i}`}>
        {renderAlt(alt)}
        {i < alts.length - 1 ? (
          <span className="hk-sep" aria-hidden="true"> • </span>
        ) : null}
      </span>
    ));
  };

  return (
    <div className="hotkeys-toast" role="dialog" aria-label="Keyboard shortcuts">
      <div className="hotkeys-title">
        <span>Hotkeys</span>
        {onClose ? (
          <button
            type="button"
            className="hotkeys-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        ) : null}
      </div>
      <ul className="hotkeys-list">
        {rows.map(([keys, desc]) => (
          <li className="hotkeys-row" key={keys}>
            <span className="keys">{renderKeys(keys)}</span>
            <span className="desc">{desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default React.memo(HotkeysCheatsheet);
