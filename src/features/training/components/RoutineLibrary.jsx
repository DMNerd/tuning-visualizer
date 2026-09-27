import { useState } from "react";

// "My Routines" list: play/load/rename/delete saved routines.
export default function RoutineLibrary({
  routines,
  isRoutinePlaying,
  playingRoutine,
  onNewRoutine,
  onStop,
  onPlay,
  onLoad,
  onRename,
  onDelete,
}) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const startRename = (routine) => {
    setRenamingId(routine.id);
    setRenameValue(routine.name || "");
  };

  const commitRename = (id) => {
    onRename(id, renameValue.trim() || "Untitled routine");
    setRenamingId(null);
  };

  return (
    <section aria-label="My Routines" className="tv-modal__manager">
      <div className="tv-modal__manager-toolbar">
        <h3>My Routines</h3>
        <button type="button" className="tv-button" onClick={onNewRoutine}>
          New routine
        </button>
      </div>
      {isRoutinePlaying ? (
        <p className="tv-field__help">
          Currently playing: {playingRoutine.name || "Untitled routine"}
          {" — "}
          <button
            type="button"
            className="tv-button tv-button--danger"
            onClick={onStop}
          >
            Stop
          </button>
        </p>
      ) : null}
      {routines.length ? (
        <ul className="tv-modal__manager-list">
          {routines.map((routine) => (
            <li key={routine.id} className="tv-modal__manager-item">
              {renamingId === routine.id ? (
                <input
                  type="text"
                  value={renameValue}
                  autoFocus
                  onChange={(event) => setRenameValue(event.target.value)}
                  onBlur={() => commitRename(routine.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitRename(routine.id);
                    if (event.key === "Escape") setRenamingId(null);
                  }}
                />
              ) : (
                <span className="tv-modal__manager-pack-name">
                  {routine.name || "Untitled routine"}
                </span>
              )}
              <div className="tv-modal__manager-actions">
                <button
                  type="button"
                  className="tv-button tv-button--primary"
                  onClick={() => onPlay(routine)}
                  disabled={isRoutinePlaying}
                >
                  Play
                </button>
                <button
                  type="button"
                  className="tv-button"
                  onClick={() => onLoad(routine)}
                >
                  Load
                </button>
                <button
                  type="button"
                  className="tv-button"
                  onClick={() => startRename(routine)}
                >
                  Rename
                </button>
                <button
                  type="button"
                  className="tv-button tv-button--danger"
                  onClick={() => onDelete(routine)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tv-field__help">No saved routines yet.</p>
      )}
    </section>
  );
}
