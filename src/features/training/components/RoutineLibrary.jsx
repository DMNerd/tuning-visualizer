import { useState } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const startRename = (routine) => {
    setRenamingId(routine.id);
    setRenameValue(routine.name || "");
  };

  const commitRename = (id) => {
    onRename(id, renameValue.trim() || t("training.untitled"));
    setRenamingId(null);
  };

  return (
    <section aria-label={t("training.library")} className="tv-modal__manager">
      <div className="tv-modal__manager-toolbar">
        <h3>{t("training.library")}</h3>
        <button type="button" className="tv-button" onClick={onNewRoutine}>
          {t("training.newRoutine")}
        </button>
      </div>
      {isRoutinePlaying ? (
        <p className="tv-field__help">
          {t("training.currentlyPlaying", {
            name: playingRoutine.name || t("training.untitled"),
          })}
          {" — "}
          <button
            type="button"
            className="tv-button tv-button--danger"
            onClick={onStop}
          >
            {t("training.stop")}
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
                  {routine.name || t("training.untitled")}
                </span>
              )}
              <div className="tv-modal__manager-actions">
                <button
                  type="button"
                  className="tv-button tv-button--primary"
                  onClick={() => onPlay(routine)}
                  disabled={isRoutinePlaying}
                >
                  {t("training.playShort")}
                </button>
                <button
                  type="button"
                  className="tv-button"
                  onClick={() => onLoad(routine)}
                >
                  {t("training.load")}
                </button>
                <button
                  type="button"
                  className="tv-button"
                  onClick={() => startRename(routine)}
                >
                  {t("training.rename")}
                </button>
                <button
                  type="button"
                  className="tv-button tv-button--danger"
                  onClick={() => onDelete(routine)}
                >
                  {t("training.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tv-field__help">{t("training.empty")}</p>
      )}
    </section>
  );
}
