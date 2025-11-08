import { useCallback, useMemo, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useLatest, useWindowSize } from "react-use";
import { findSystemByEdo, getSystemLabel } from "@/lib/theory/tuning";
import { memoWithPick } from "@/utils/memo";
import ModalFrame from "@/components/UI/modals/ModalFrame";

function normalizePack(pack) {
  if (!pack || typeof pack !== "object") return null;
  const edo = Number(pack?.system?.edo);
  const metaSystemId =
    typeof pack?.meta?.systemId === "string" ? pack.meta.systemId : null;
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
    metaSystemId,
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
  const [query, setQuery] = useState("");
  const onCloseRef = useLatest(onClose);
  const onEditRef = useLatest(onEdit);
  const onDeleteRef = useLatest(onDelete);

  const handleClose = useCallback(() => {
    onCloseRef.current?.();
  }, [onCloseRef]);

  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();

  const groups = useMemo(() => {
    if (!Array.isArray(tunings) || tunings.length === 0) return [];

    const hasQuery = normalizedQuery.length > 0;
    const grouped = new Map();

    tunings.forEach((entry) => {
      const normalized = normalizePack(entry);
      if (!normalized) return;

      const edoValue = Number.isFinite(normalized?.edo)
        ? normalized.edo
        : Number.NaN;
      const systemMatch = findSystemByEdo(
        systems,
        edoValue,
        normalized?.metaSystemId,
      );
      const systemLabel = getSystemLabel({
        match: systemMatch,
        edo: edoValue,
        metaSystemId: normalized?.metaSystemId,
      });

      const formattedStringsCount = formatStringsCount(normalized.stringsCount);

      const matchesQuery = !hasQuery
        ? true
        : [
            normalized.displayName,
            normalized.rawName,
            String(normalized.stringsCount ?? ""),
            formattedStringsCount,
            systemLabel,
          ].some(
            (value) =>
              typeof value === "string" &&
              value.toLowerCase().includes(normalizedQuery),
          );

      if (!matchesQuery) {
        return;
      }

      if (!grouped.has(systemLabel)) {
        grouped.set(systemLabel, {
          edo: Number.isFinite(edoValue) ? edoValue : Number.POSITIVE_INFINITY,
          systemLabel,
          packs: [],
        });
      }

      grouped.get(systemLabel).packs.push(normalized);
    });

    const result = Array.from(grouped.values());

    result.sort((a, b) => {
      if (a.edo !== b.edo) return a.edo - b.edo;
      return a.systemLabel.localeCompare(b.systemLabel);
    });

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
  }, [tunings, systems, normalizedQuery]);

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

  const hasTunings = Array.isArray(tunings) && tunings.length > 0;

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
        {hasTunings ? (
          <div className="tv-modal__manager-toolbar">
            <div className="tv-modal__manager-search">
              <label htmlFor="tuning-pack-filter">Filter packs</label>
              <input
                id="tuning-pack-filter"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, system, or string count"
                aria-controls="tuning-pack-manager-sections"
                autoComplete="off"
              />
            </div>
          </div>
        ) : null}
      </header>
      <div className="tv-modal__body">
        {groups.length ? (
          <div
            id="tuning-pack-manager-sections"
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
        ) : hasTunings ? (
          <div
            id="tuning-pack-manager-sections"
            className="tv-modal__empty tv-modal__empty--muted"
          >
            <h3>No matches found</h3>
            <p>Try a different filter to see your saved packs.</p>
          </div>
        ) : (
          <div id="tuning-pack-manager-sections" className="tv-modal__empty">
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
    onClose: p.onClose,
    onEdit: p.onEdit,
    onDelete: p.onDelete,
  };
}

const TuningPackManagerModalMemo = memoWithPick(TuningPackManagerModal, pick);

export default TuningPackManagerModalMemo;
