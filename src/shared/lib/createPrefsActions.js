import { makeImmerSetters } from "@shared/lib/makeImmerSetters";
import { applyValueOrUpdaterOnDraft } from "@shared/lib/applyValueOrUpdaterOnDraft";

// Shared state + actions for persisted `prefs` stores (display, metronome):
// a `prefs` object with per-key setters, a rehydrate lifecycle flag, and
// defaults backfill. Spread into the store's immer initializer.
export function createPrefsActions(set, get, defaults, setterKeys) {
  const setPrefs = (update) => {
    set((state) => {
      applyValueOrUpdaterOnDraft(state, "prefs", update);
    });
  };

  return {
    prefs: defaults,
    // Generic persist-rehydrate lifecycle flag for app bootstrap/UI timing.
    // Not consumed by URL-share hydration flow.
    isHydrated: false,
    setPrefs,
    setHydrated: (isHydrated = true) =>
      set({ isHydrated: Boolean(isHydrated) }),
    setters: makeImmerSetters((updater) => setPrefs(updater), setterKeys),
    hydrateWithDefaults: (nextDefaults) => {
      if (!nextDefaults) return;
      const { prefs } = get();
      set({ prefs: { ...nextDefaults, ...prefs } });
    },
  };
}
