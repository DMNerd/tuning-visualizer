const SESSION_WINDOW_ID_KEY = "tv.windowId";
const FALLBACK_WINDOW_ID_KEY = "__TV_WINDOW_ID__";

function createWindowId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `window-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getWindowId() {
  const globalScope = globalThis as typeof globalThis & {
    [FALLBACK_WINDOW_ID_KEY]?: string;
  };
  const cached = globalScope[FALLBACK_WINDOW_ID_KEY];
  if (typeof cached === "string" && cached.length > 0) {
    return cached;
  }

  let windowId = "";

  try {
    if (typeof globalThis.sessionStorage !== "undefined") {
      const existing = globalThis.sessionStorage.getItem(SESSION_WINDOW_ID_KEY);
      if (typeof existing === "string" && existing.length > 0) {
        windowId = existing;
      } else {
        windowId = createWindowId();
        globalThis.sessionStorage.setItem(SESSION_WINDOW_ID_KEY, windowId);
      }
    }
  } catch {
    // Ignore environments where sessionStorage is unavailable.
  }

  if (!windowId) {
    windowId = createWindowId();
  }

  globalScope[FALLBACK_WINDOW_ID_KEY] = windowId;
  return windowId;
}

export function scopeKey(baseKey: string) {
  return `${baseKey}:${getWindowId()}`;
}
