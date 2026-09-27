// One-shot cleanup of pre-persist localStorage keys: a store marks them while
// migrating/merging, then removes them after a successful rehydrate.
export function createLegacyKeyCleanup(keys) {
  let pending = false;
  return {
    mark() {
      pending = true;
    },
    run() {
      if (!pending) return;
      pending = false;
      if (typeof globalThis.localStorage === "undefined") return;
      for (const key of keys) {
        globalThis.localStorage.removeItem(key);
      }
    },
  };
}
