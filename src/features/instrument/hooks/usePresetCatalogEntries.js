import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  buildPresetBadges,
  presetDisplayName,
} from "@features/instrument/model/presetBadges";

// Shared by the preset dropdown and gallery: the catalog entries, their
// badges, and the search terms both views filter on.
export function usePresetCatalogEntries(presetCatalog) {
  const { t } = useTranslation();
  const entries = useMemo(
    () => (Array.isArray(presetCatalog) ? presetCatalog : []),
    [presetCatalog],
  );
  const badgesByKey = useMemo(
    () =>
      new Map(entries.map((entry) => [entry.key, buildPresetBadges(entry)])),
    [entries],
  );
  const getSearchTerms = useCallback(
    (entry) => [
      presetDisplayName(t, entry.name),
      t("instrument.stringCountShort", { count: entry.strings }),
      t("instrument.stringCount", { count: entry.strings }),
      ...(badgesByKey.get(entry.key) ?? []).map((badge) => t(badge.labelKey)),
    ],
    [badgesByKey, t],
  );
  return { entries, badgesByKey, getSearchTerms };
}
