import { useCallback, useMemo } from "react";
import {
  buildPresetBadges,
  stringCountLabel,
} from "@features/instrument/model/presetBadges";

// Shared by the preset dropdown and gallery: the catalog entries, their
// badges, and the search terms both views filter on.
export function usePresetCatalogEntries(presetCatalog) {
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
      entry.name,
      `${entry.strings}-string`,
      stringCountLabel(entry.strings),
      ...(badgesByKey.get(entry.key) ?? []).map((badge) => badge.label),
    ],
    [badgesByKey],
  );
  return { entries, badgesByKey, getSearchTerms };
}
