const toSetterName = (k) => `set${k.charAt(0).toUpperCase()}${k.slice(1)}`;

/**
 * Builds Immer-friendly field setters for an object state.
 *
 * @param {(updater: (draft:any) => void) => void} setFn - your Immer-enabled setState
 * @param {string[] | Record<string, string>} keysOrMap
 *   - array of keys -> auto names like setFoo()
 *   - or map { key: "customSetterName" }
 * @returns {Record<string, Function>}
 */
export function makeImmerSetters(setFn, keysOrMap) {
  const out = {};
  if (Array.isArray(keysOrMap)) {
    for (const key of keysOrMap) {
      const name = toSetterName(key);
      out[name] = (v) =>
        setFn((d) => {
          d[key] = typeof v === "function" ? v(d[key]) : v;
        });
    }
  } else {
    for (const [key, name] of Object.entries(keysOrMap)) {
      const setterName = name || toSetterName(key);
      out[setterName] = (v) =>
        setFn((d) => {
          d[key] = typeof v === "function" ? v(d[key]) : v;
        });
    }
  }
  return out;
}
