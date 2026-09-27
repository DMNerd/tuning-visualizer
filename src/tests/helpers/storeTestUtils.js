export class MemoryStorage {
  constructor() {
    this.map = new Map();
    this.setItemCounts = new Map();
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.map.set(key, String(value));
    this.setItemCounts.set(key, (this.setItemCounts.get(key) || 0) + 1);
  }

  removeItem(key) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
    this.setItemCounts.clear();
  }

  getSetItemCount(key) {
    return this.setItemCounts.get(key) || 0;
  }
}

// Re-imports an aliased module (e.g. "@features/...") with a cache-busting
// query so each test gets fresh module-level store state.
export function importFresh(specifier) {
  const cacheKey = `${Date.now()}-${Math.random()}`;
  return import(`${specifier}?t=${cacheKey}`);
}

// Fresh-imports a persisted store module, rehydrates the named store export
// from storage, and returns it.
export async function rehydrateFresh(specifier, exportName) {
  const store = (await importFresh(specifier))[exportName];
  await store.persist.rehydrate();
  return store;
}
