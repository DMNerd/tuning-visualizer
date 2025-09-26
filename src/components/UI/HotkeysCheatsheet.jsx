// src/components/UI/HotkeysHelpToast.jsx
import React from "react";

function HotkeysHelpToast() {
  const rows = [
    ["f", "fullscreen"],
    ["?", "show this help"],
    ["l", "cycle labels"],
    ["o", "toggle open notes"],
    ["n", "toggle fret numbers"],
    ["d", "color by degree"],
    ["a", "sharps ↔ flats"],
    ["g", "left-handed layout"],
    ["c", "chord overlay"],
    ["h", "hide non-chord tones"],
    ["[ / ]", "strings − / ＋"],
    ["- / =", "frets − / ＋"],
    [", / .", "dot size − / ＋"],
  ];

  return (
    <div className="hotkeys-toast">
      <div className="hotkeys-title">Hotkeys</div>
      <ul className="hotkeys-list">
        {rows.map(([keys, desc]) => (
          <li key={keys}>
            <span className="keys">
              {keys.split(" / ").map((k, i) => (
                <kbd key={k}>
                  {k}
                  {i < keys.split(" / ").length - 1 ? "" : null}
                </kbd>
              ))}
            </span>
            <span className="desc">{desc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default React.memo(HotkeysHelpToast);
