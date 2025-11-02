import { useCallback, useMemo } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useLatest, useWindowSize } from "react-use";
import { memoWithPick } from "@/utils/memo";
import ModalFrame from "./ModalFrame";

function getSystemIdByEdo(systems, edo) {
  if (!systems || typeof systems !== "object") return null;
  const entries = Object.entries(systems);
  for (const [id, value] of entries) {
    if (!value) continue;
    const divisions = Number(
      value?.divisions ?? value?.edo ?? value?.system?.edo,
    );
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

function TuningPackManagerModal({
  isOpen,
  tunings = [],
  systems = {},
  onClose,
  onEdit,
  onDelete,
}) {
  const onCloseRef = useLatest(onClose);
  const onEditRef = useLatest(onEdit);
  const onDeleteRef = useLatest(onDelete);

  const handleClose = useCallback(() => {
    onCloseRef.current?.();
  }, [onCloseRef]);

  // Group by system only (e.g., "12-TET", "24-TET"), not by string count.
  const groups = useMemo(() => {
    if (!Array.isArray(tunings) || tunings.length === 0) return [];

    const grouped = new Map();

    tunings.forEach((entry) => {
      const normalized = normalizePack(entry);
      if (!normalized) return;

      const { edo } = normalized;
      const systemId = Number.isFinite(edo)
        ? getSystemIdByEdo(systems, edo)
        : null;
      const systemLabel = systemId
        ? systemId
        : Number.isFinite(edo)
          ? `${edo}-TET`
          : "Unknown system";

      if (!grouped.has(systemLabel)) {
        grouped.set(systemLabel, {
          edo: Number.isFinite(edo) ? edo : Number.POSITIVE_INFINITY,
          systemLabel,
          packs: [],
        });
      }

      grouped.get(systemLabel).packs.push(normalized);
    });

    const result = Array.from(grouped.values());

    // Sort groups by ascending EDO, then label
    result.sort((a, b) => {
      if (a.edo !== b.edo) return a.edo - b.edo;
      return a.systemLabel.localeCompare(b.systemLabel);
    });

    // Within each group, sort packs by string count, then name
    result.forEach((group) => {
      group.packs.sort((a, b) => {
        if (a.stringsCount !== b.stringsCount) {
          return a.stringsCount - b.stringsCount;
        }
        return a.displayName.localeCompare(b.displayName, undefined, {
          sensitivity: "base",
        });
      });
    });

    return result;
  }, [tunings, systems]);

  const handleEdit = useCallback(
    (pack) => {
      if (!pack) return;
      onEditRef.current?.(pack);
      handleClose();
    },
    [onEditRef, handleClose],
  );

  const handleDelete = useCallback(
    (name) => {
      if (typeof name !== "string") return;
      onDeleteRef.current?.(name);
    },
    [onDeleteRef],
  );

  const { height: winH } = useWindowSize();
  const listMaxH = Math.max(240, winH - 320);

  if (!isOpen) return null;

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel="Manage custom tunings"
      closeHotkeys={[
        (event) =>
          (event.key === "w" || event.key === "W") &&
          (event.metaKey || event.ctrlKey),
      ]}
    >
      <header className="tv-modal__header">
        <h2>Manage custom tunings</h2>
        <p className="tv-modal__summary">
          Review your saved packs, edit their details, or remove the ones you no
          longer need.
        </p>
      </header>
      <div className="tv-modal__body">
        {groups.length ? (
          <div
            className="tv-modal__manager"
            style={{ maxHeight: listMaxH, overflow: "auto" }}
          >
            {groups.map((group) => (
              <section
                key={group.systemLabel}
                className="tv-modal__manager-group"
              >
                <header className="tv-modal__manager-group-header">
                  <div className="tv-modal__manager-group-title">
                    <h3>{group.systemLabel}</h3>
                  </div>
                  <span className="tv-modal__manager-group-count">
                    {group.packs.length}{" "}
                    {group.packs.length === 1 ? "pack" : "packs"}
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
                          <span className="tv-modal__manager-pack-name">
                            {pack.displayName}
                          </span>
                          <span className="tv-modal__manager-pack-preview">
                            {formatStringsCount(pack.stringsCount)}
                            {preview ? ` · ${preview}` : ""}
                          </span>
                        </div>
                        <div className="tv-modal__manager-actions">
                          <button
                            type="button"
                            className="tv-button tv-button--icon tv-button--ghost tv-button--accent"
                            onClick={() => handleEdit(pack.raw)}
                            aria-label={`Edit ${pack.displayName}`}
                            title="Edit"
                          >
                            <FiEdit2 aria-hidden="true" focusable="false" />
                            <span className="tv-button__label">Edit</span>
                          </button>
                          <button
                            type="button"
                            className="tv-button tv-button--icon tv-button--ghost tv-button--danger"
                            onClick={() => handleDelete(pack.rawName)}
                            aria-label={`Remove ${pack.displayName}`}
                            title="Remove"
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
    </ModalFrame>
  );
}

function pick(p) {
  return {
    isOpen: p.isOpen,
    tunings: p.tunings,
    systems: p.systems,
  };
}

const TuningPackManagerModalMemo = memoWithPick(TuningPackManagerModal, pick);

export default TuningPackManagerModalMemo;
