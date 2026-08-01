/** Removes only the given query keys via history.replaceState, preserving
 * every other param — unlike a blanket `location.search = ""` clear, this is
 * safe when multiple features each own their own query param in one URL. */
export function removeUrlSearchParams(keys: readonly string[]): void {
  if (typeof window === "undefined" || !window.history?.replaceState) return;

  const url = new URL(window.location.href);
  let changed = false;
  for (const key of keys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (!changed) return;

  window.history.replaceState(window.history.state, "", url.toString());
}
