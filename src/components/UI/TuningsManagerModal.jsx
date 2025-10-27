import { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useKey, useLockBodyScroll } from "react-use";
import { memoWithPick } from "@/utils/memo";

function getSystemIdByEdo(systems, edo) {
  if (!systems || typeof systems !== "object") return null;
  const entries = Object.entries(systems);
  for (const [id, value] of entries) {
    if (!value) continue;
    const divisions = Number(value?.divisions ?? value?.edo ?? value?.system?.edo);
    if (Number.isFinite(divisions) && divisions === edo) {
      return id;
    }
  }
  return null;
}

function normalizePack(pack) {
  if (!pack || typeof pack !== "object") return null;
  const edo = Number(pack?.system?.edo);
  const rawName = typeof pack?.name === "string" ? pack.name : "";
  const displayName = rawName.trim().length ? rawName : "Untitled pack";
  const strings = Array.isArray(pack?.tuning?.strings)
    ? pack.tuning.strings
    : [];
  const stringsCount = strings.length;
  return {
    raw: pack,
    rawName,
    displayName,
    edo: Number.isFinite(edo) ? edo : null,
    strings,
    stringsCount,
  };
}

function formatStringsCount(stringsCount) {
  if (!Number.isFinite(stringsCount) || stringsCount <= 0) {
    return "Unknown string count";
  }
  return `${stringsCount} string${stringsCount === 1 ? "" : "s"}`;
}

function TuningsManagerModal({
  isOpen,
  tunings = [],
  systems = {},
  onClose,
  onEdit,
  onDelete,
}) {
  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useLockBodyScroll(isOpen);

  useKey(
    "Escape",
    (event) => {
      if (!isOpen) return;
      event.preventDefault();
      handleClose();
    },
    { event: "keydown" },
    [isOpen, handleClose],
  );

  const groups = useMemo(() => {
    if (!Array.isArray(tunings) || tunings.length === 0) return [];

    const grouped = new Map();

    tunings.forEach((entry) => {
      const normalized = normalizePack(entry);
      if (!normalized) return;

      const { edo, stringsCount } = normalized;
      const systemId = Number.isFinite(edo) ? getSystemIdByEdo(systems, edo) : null;
      const systemLabel = systemId
        ? systemId
        : Number.isFinite(edo)
        ? `${edo}-TET`
        : "Unknown system";
      const normalizedStringsCount = Number.isFinite(stringsCount) ? stringsCount : null;
      const key = `${systemLabel}__${normalizedStringsCount ?? "unknown"}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          edo: Number.isFinite(edo) ? edo : Number.POSITIVE_INFINITY,
          stringsCount: normalizedStringsCount,
          systemLabel,
          packs: [],
        });
      }

      grouped.get(key).packs.push(normalized);
    });

    const result = Array.from(grouped.values());

    result.sort((a, b) => {
      if (a.edo !== b.edo) return a.edo - b.edo;
      const stringsA = Number.isFinite(a.stringsCount)
        ? a.stringsCount
        : Number.POSITIVE_INFINITY;
      const stringsB = Number.isFinite(b.stringsCount)
        ? b.stringsCount
        : Number.POSITIVE_INFINITY;
      if (stringsA !== stringsB) return stringsA - stringsB;
      return a.systemLabel.localeCompare(b.systemLabel);
    });

    result.forEach((group) => {
      group.packs.sort((a, b) =>
        a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }),
      );
    });

    return result;
  }, [tunings, systems]);

  const handleEdit = useCallback(
    (pack) => {
      if (!pack) return;
      onEdit?.(pack);
      handleClose();
    },
    [onEdit, handleClose],
  );

  const handleDelete = useCallback(
    (name) => {
      if (typeof name !== "string") return;
      onDelete?.(name);
    },
    [onDelete],
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="tv-modal" role="presentation">
      <div className="tv-modal__backdrop" aria-hidden onClick={handleClose} />
      <div
        className="tv-modal__card"
        role="dialog"
        aria-modal="true"
        aria-label="Manage custom tunings"
      >
        <header className="tv-modal__header">
          <h2>Manage custom tunings</h2>
          <p className="tv-modal__summary">
            Review your saved packs, edit their details, or remove the ones you no longer need.
          </p>
        </header>
        <div className="tv-modal__body">
          {groups.length ? (
            <div className="tv-modal__manager">
              {groups.map((group) => (
                <section key={group.key} className="tv-modal__manager-group">
                  <header className="tv-modal__manager-group-header">
                    <div className="tv-modal__manager-group-title">
                      <h3>{group.systemLabel}</h3>
                      <span>{formatStringsCount(group.stringsCount)}</span>
                    </div>
                    <span className="tv-modal__manager-group-count">
                      {group.packs.length} {group.packs.length === 1 ? "pack" : "packs"}
                    </span>
                  </header>
                  <ul className="tv-modal__manager-list">
                    {group.packs.map((pack, index) => {
                      const preview = pack.strings
                        .map((string) => string?.note || string?.label || "•")
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <li
                          key={`${pack.rawName || pack.displayName}__${index}`}
                          className="tv-modal__manager-item"
                        >
                          <div className="tv-modal__manager-pack">
                            <span className="tv-modal__manager-pack-name">{pack.displayName}</span>
                            {preview ? (
                              <span className="tv-modal__manager-pack-preview">{preview}</span>
                            ) : null}
                          </div>
                          <div className="tv-modal__manager-actions">
                            <button
                              type="button"
                              className="tv-button"
                              onClick={() => handleEdit(pack.raw)}
                            >
                              <FiEdit2 aria-hidden="true" focusable="false" />
                              <span className="tv-button__label">Edit</span>
                            </button>
                            <button
                              type="button"
                              className="tv-button"
                              onClick={() => handleDelete(pack.rawName)}
                            >
                              <FiTrash2 aria-hidden="true" focusable="false" />
                              <span className="tv-button__label">Remove</span>
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="tv-modal__empty">
              <h3>No custom tunings yet</h3>
              <p>Save a tuning pack to manage it here.</p>
            </div>
          )}
        </div>
        <footer className="tv-modal__footer">
          <button type="button" className="tv-button" onClick={handleClose}>
            Close
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function pick(p) {
  return {
    isOpen: p.isOpen,
    tunings: p.tunings,
    systems: p.systems,
  };
}

const TuningsManagerModalMemo = memoWithPick(TuningsManagerModal, pick);

export default TuningsManagerModalMemo;