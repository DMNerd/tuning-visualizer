import { scopeKey } from "@/lib/storage/windowScope";

function getLocalStorage() {
  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }

  return globalThis.localStorage;
}

export function createScopedLocalStorage({
  scoped = false,
  migrateLegacy = true,
  migrateScopedToUnscoped = false,
  removeScopedAfterUnscopedMigration = false,
} = {}) {
  return {
    getItem: (name: string) => {
      const storage = getLocalStorage();
      if (!storage) return null;

      if (!scoped) {
        const unscopedValue = storage.getItem(name);
        if (unscopedValue !== null) {
          return unscopedValue;
        }

        if (!migrateScopedToUnscoped) {
          return null;
        }

        const scopedValue = storage.getItem(scopeKey(name));
        if (scopedValue === null) {
          return null;
        }

        storage.setItem(name, scopedValue);
        if (removeScopedAfterUnscopedMigration) {
          storage.removeItem(scopeKey(name));
        }
        return scopedValue;
      }

      const scopedName = scopeKey(name);
      const scopedValue = storage.getItem(scopedName);
      if (scopedValue !== null) {
        return scopedValue;
      }

      if (!migrateLegacy) {
        return null;
      }

      const legacyValue = storage.getItem(name);
      if (legacyValue === null) {
        return null;
      }

      storage.setItem(scopedName, legacyValue);
      return legacyValue;
    },
    setItem: (name: string, value: string) => {
      const storage = getLocalStorage();
      if (!storage) return;
      storage.setItem(scoped ? scopeKey(name) : name, value);
    },
    removeItem: (name: string) => {
      const storage = getLocalStorage();
      if (!storage) return;
      storage.removeItem(scoped ? scopeKey(name) : name);
    },
  };
}

export function createGlobalStorage() {
  return createScopedLocalStorage({
    scoped: false,
    migrateScopedToUnscoped: true,
    removeScopedAfterUnscopedMigration: true,
  });
}

export function createScopedStorage() {
  return createScopedLocalStorage({
    scoped: true,
    migrateLegacy: true,
  });
}
