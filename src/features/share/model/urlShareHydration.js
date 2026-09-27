import { matchesPack } from "@domain/presets/packIdentity";
import { isObjectLike } from "@shared/lib/object";
import { trimmedString } from "@shared/lib/strings";

function hasAnyValues(payload) {
  return (
    isObjectLike(payload?.values) && Object.keys(payload.values).length > 0
  );
}

// Finds a local custom pack matching the shared meta.id or preset name.
export function findPackByReference(customTunings, { packId, presetName }) {
  if (!Array.isArray(customTunings)) return null;
  return (
    customTunings.find((entry) =>
      matchesPack(entry, { id: packId, name: presetName }),
    ) ?? null
  );
}

// The pack to save locally from a shared link, tagged as URL-sourced.
export function buildSharedPackPayload(packPayload, presetName) {
  return {
    ...packPayload,
    name: trimmedString(packPayload?.name) || presetName,
    meta: {
      ...(isObjectLike(packPayload?.meta) ? packPayload.meta : {}),
      sharedViaUrl: true,
    },
  };
}

export function areShareDomainsHydrated({
  theoryHydrated = false,
  instrumentHydrated = false,
} = {}) {
  // URL-share hydration intentionally gates on theory + instrument only.
  // Display/metronome hydration is generic app bootstrap and not share-critical.
  return Boolean(theoryHydrated) && Boolean(instrumentHydrated);
}

export function shouldApplyUrlHydration({
  parsedOnce = false,
  appliedOnce = false,
  hydrationReady = false,
  payload = null,
} = {}) {
  return (
    Boolean(parsedOnce) &&
    !appliedOnce &&
    Boolean(hydrationReady) &&
    hasAnyValues(payload)
  );
}

export function evaluateUrlShareNoticeState({
  hasSearch = false,
  payload = null,
} = {}) {
  if (!hasSearch) return "none";
  return hasAnyValues(payload) ? "valid" : "invalid";
}

export function clearUrlSearchParams() {
  if (typeof window === "undefined" || !window.history?.replaceState) return;
  const current = new URL(window.location.href);
  if (!current.search) return;
  current.search = "";
  window.history.replaceState(window.history.state, "", current.toString());
}
