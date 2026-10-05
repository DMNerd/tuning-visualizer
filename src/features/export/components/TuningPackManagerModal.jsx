import { useCallback, useMemo, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useLatest } from "@shared/hooks/stateHooks";
import { useWindowHeight } from "@shared/hooks/domHooks";
import { findSystemByEdo, getSystemLabel } from "@domain/theory/tuning";
import { memoWithShallowPick } from "@shared/lib/memo";
import ModalFrame from "@shared/ui/ModalFrame";
import {
  formatStringsCount,
  normalizePack,
  packMatchesQuery,
} from "@features/export/model/tuningPackSearch";

function TuningPackManagerModal({
  isOpen,
  tunings = [],
  systems = {},
  onClose,
  onEdit,
  onDelete,
}) {
  const { t } = useTranslation();
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

    const grouped = new Map();

    tunings.forEach((entry) => {
      const normalized = normalizePack(entry, t);
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

      const formattedStringsCount = formatStringsCount(
        normalized.stringsCount,
        t,
      );

      const matchesQuery = packMatchesQuery({
        normalizedPack: normalized,
        systemLabel,
        normalizedQuery,
        formattedStringsCount,
      });
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
  }, [tunings, systems, normalizedQuery, t]);

  const handleEdit = useCallback(
    (pack) => {
      if (!pack) return;
      onEditRef.current?.(pack);
      handleClose();
    },
    [onEditRef, handleClose],
  );

  const handleDelete = useCallback(
    (pack) => {
      if (!pack) return;
      onDeleteRef.current?.(pack);
    },
    [onDeleteRef],
  );

  const winH = useWindowHeight();
  const listMaxH = Math.max(240, winH - 320);

  const hasTunings = Array.isArray(tunings) && tunings.length > 0;

  if (!isOpen) return null;

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel={t("manager.title")}
      closeHotkeys={[
        (event) =>
          (event.key === "w" || event.key === "W") &&
          (event.metaKey || event.ctrlKey),
      ]}
    >
      <header className="tv-modal__header">
        <h2>{t("manager.title")}</h2>
        <p className="tv-modal__summary">{t("manager.summary")}</p>
        {hasTunings ? (
          <div className="tv-modal__manager-toolbar">
            <div className="tv-modal__manager-search">
              <label htmlFor="tuning-pack-filter">{t("manager.filter")}</label>
              <input
                id="tuning-pack-filter"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("manager.filterPlaceholder")}
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
                    {t("manager.packCount", { count: group.packs.length })}
                  </span>
                </header>
                <ul className="tv-modal__manager-list">
                  {group.packs.map((pack) => {
                    return (
                      <li
                        key={pack.raw?.meta?.id ?? pack.rawName}
                        className="tv-modal__manager-item"
                      >
                        <div className="tv-modal__manager-pack">
                          <span className="tv-modal__manager-pack-name">
                            {pack.displayName}
                          </span>
                          <span className="tv-modal__manager-pack-preview">
                            {formatStringsCount(pack.stringsCount, t)}
                            {pack.stringPreview
                              ? ` · ${pack.stringPreview}`
                              : ""}
                          </span>
                        </div>
                        <div className="tv-modal__manager-actions">
                          <button
                            type="button"
                            className="tv-button tv-button--icon tv-button--ghost tv-button--accent"
                            onClick={() => handleEdit(pack.raw)}
                            aria-label={t("manager.editAria", {
                              name: pack.displayName,
                            })}
                            title={t("manager.edit")}
                          >
                            <FiEdit2 aria-hidden="true" focusable="false" />
                            <span className="tv-button__label">
                              {t("manager.edit")}
                            </span>
                          </button>
                          <button
                            type="button"
                            className="tv-button tv-button--icon tv-button--ghost tv-button--danger"
                            onClick={() => handleDelete(pack.raw)}
                            aria-label={t("manager.removeAria", {
                              name: pack.displayName,
                            })}
                            title={t("manager.remove")}
                          >
                            <FiTrash2 aria-hidden="true" focusable="false" />
                            <span className="tv-button__label">
                              {t("manager.remove")}
                            </span>
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
            <h3>{t("manager.noMatchesTitle")}</h3>
            <p>{t("manager.noMatchesBody")}</p>
          </div>
        ) : (
          <div id="tuning-pack-manager-sections" className="tv-modal__empty">
            <h3>{t("manager.emptyTitle")}</h3>
            <p>{t("manager.emptyBody")}</p>
          </div>
        )}
      </div>
      <footer className="tv-modal__footer">
        <button type="button" className="tv-button" onClick={handleClose}>
          {t("common.close")}
        </button>
      </footer>
    </ModalFrame>
  );
}

function pick(p) {
  const tuningsLength = Array.isArray(p.tunings) ? p.tunings.length : 0;
  return {
    isOpen: p.isOpen,
    tunings: p.tunings,
    tuningsLength,
    systems: p.systems,
    onClose: p.onClose,
    onEdit: p.onEdit,
    onDelete: p.onDelete,
  };
}

// Comparator strategy: shallow/reference-first checks to avoid deep modal prop diffs.
// Upstream should provide stable refs for tunings/systems and action callbacks.
const TuningPackManagerModalMemo = memoWithShallowPick(
  TuningPackManagerModal,
  pick,
);

export default TuningPackManagerModalMemo;
