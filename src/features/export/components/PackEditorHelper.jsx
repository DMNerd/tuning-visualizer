import { STR_MAX, STR_MIN } from "@shared/config/appDefaults";
import { SPELLING_MARKER_DISPLAY } from "@domain/theory/notation";

const EXAMPLE_SNIPPET = JSON.stringify(
  {
    name: "Custom pack example",
    spelling: "german",
    system: { edo: 12 },
    tuning: {
      strings: [
        { label: "String 1", note: "E" },
        { label: "String 2", note: "Hih" },
        { label: "String 3", midi: 55 },
        { label: "String 4", note: "Aeh" },
      ],
    },
    meta: {
      stringMeta: [{ index: 0, startFret: 2, greyBefore: true }],
      board: { fretStyle: "dotted", notePlacement: "onFret" },
    },
  },
  null,
  2,
);

// Collapsible side panel listing pack rules, shortcut actions and an example.
export default function PackEditorHelper({
  isCollapsed,
  onToggle,
  icons,
  hasSpellingHint,
  onInsertString,
  onResetTemplate,
  onToggleSpellingHint,
}) {
  return (
    <>
      <div className="tv-pack-helper__toggle-row">
        <button
          type="button"
          className="tv-pack-helper__toggle"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-controls="pack-helper-content"
          aria-label={`${isCollapsed ? "Show" : "Hide"} pack helper details`}
        >
          <span
            className={`tv-pack-helper__chevron${
              isCollapsed ? " is-rotated" : ""
            }`}
            aria-hidden
          >
            {icons.chevron}
          </span>
          <span className="tv-pack-helper__toggle-label">
            {isCollapsed ? "Show helper" : "Hide helper"}
          </span>
        </button>
      </div>
      <aside
        id="pack-helper-content"
        className={`tv-pack-helper${isCollapsed ? " is-hidden" : ""}`}
        tabIndex={isCollapsed ? -1 : 0}
        aria-label="Tuning pack requirements and quick actions"
        aria-expanded={!isCollapsed}
        aria-hidden={isCollapsed}
      >
        <div className="tv-pack-helper__header">
          <div className="tv-pack-helper__header-text">
            <h3>Pack requirements</h3>
            <p>
              Ensure your pack stays valid while you edit. Keep these rules in
              mind:
            </p>
          </div>
        </div>
        <div className="tv-pack-helper__content">
          <ul className="tv-pack-helper__list">
            <li>
              <strong>Name:</strong> required text label.
            </li>
            <li>
              <strong>system.edo:</strong> integer {"\u2265"} 12.
            </li>
            <li>
              <strong>Strings:</strong> between {STR_MIN} and {STR_MAX} entries.
            </li>
            <li>
              <strong>Each string:</strong> include a <code>note</code> or{" "}
              <code>midi</code> value (labels optional).
            </li>
            <li>
              <strong>spelling</strong> (optional): set to{" "}
              {SPELLING_MARKER_DISPLAY.map((marker, idx) => (
                <span key={marker}>
                  {idx > 0 ? ", " : ""}
                  <code>"{marker}"</code>
                </span>
              ))}{" "}
              to auto-translate notes to international spellings for internal
              logic (for example <code>Hih</code> → <code>B↑</code>,{" "}
              <code>Aeh</code> → <code>A↓</code>). Arrow forms are accepted too.
            </li>
          </ul>
          <div className="tv-pack-helper__meta">
            <div className="tv-pack-helper__meta-section">
              <div className="tv-pack-helper__meta-title">String meta</div>
              <p className="tv-pack-helper__meta-copy">
                Optional <code>meta.stringMeta</code> entries let you set
                per-string visuals.
              </p>
              <ul className="tv-pack-helper__meta-list">
                <li>
                  <code>index</code>: the string number to target (required).
                </li>
                <li>
                  <code>startFret</code>: first fret to render (default 0).
                </li>
                <li>
                  <code>greyBefore</code>: hide frets before start (default
                  true).
                </li>
              </ul>
            </div>
            <div className="tv-pack-helper__meta-section">
              <div className="tv-pack-helper__meta-title">Board meta</div>
              <p className="tv-pack-helper__meta-copy">
                Configure <code>meta.board</code> to control fretboard defaults.
              </p>
              <ul className="tv-pack-helper__meta-list">
                <li>
                  <code>fretStyle</code>: <code>"solid"</code> or{" "}
                  <code>"dotted"</code>.
                </li>
                <li>
                  <code>notePlacement</code>: <code>"between"</code> or{" "}
                  <code>"onFret"</code>.
                </li>
                <li>
                  <code>hiddenFrets</code>: array of 0-based rendered fret
                  indices to hide (N-TET safe). Example: <code>[0, 1, 13]</code>
                  .
                </li>
                <li>
                  Pattern/modulo shorthand is not supported here; repeat indices
                  per octave manually when needed.
                </li>
              </ul>
            </div>
          </div>
          <div
            className="tv-pack-helper__actions"
            role="group"
            aria-label="Pack shortcuts"
          >
            <button
              type="button"
              className="tv-button tv-button--ghost"
              onClick={onInsertString}
            >
              {icons.add} Add string
            </button>
            <button
              type="button"
              className="tv-button tv-button--ghost"
              onClick={onResetTemplate}
            >
              {icons.reset} Reload template
            </button>
            <button
              type="button"
              className="tv-button tv-button--ghost"
              onClick={onToggleSpellingHint}
            >
              {hasSpellingHint ? icons.cancel : icons.ok}{" "}
              {hasSpellingHint
                ? "Remove spelling hint"
                : 'Set spelling: "de-h/b"'}
            </button>
          </div>
          <div className="tv-pack-helper__example">
            <div className="tv-pack-helper__example-header">
              Example snippet
            </div>
            <pre>
              <code>{EXAMPLE_SNIPPET}</code>
            </pre>
          </div>
        </div>
      </aside>
    </>
  );
}
