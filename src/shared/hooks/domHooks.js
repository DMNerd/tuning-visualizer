import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { useLatest } from "@shared/hooks/stateHooks";

function matchesKey(key, event) {
  if (typeof key === "function") return key(event);
  if (typeof key === "string") return event.key === key;
  return Boolean(key);
}

// Window key listener. key: event.key string, predicate, or true for any key.
// Registered once; always calls the latest key/handler.
export function useKey(key, handler, { event = "keydown" } = {}) {
  const keyRef = useLatest(key);
  const handlerRef = useLatest(handler);

  useEffect(() => {
    const listener = (e) => {
      if (matchesKey(keyRef.current, e)) handlerRef.current(e);
    };
    window.addEventListener(event, listener);
    return () => window.removeEventListener(event, listener);
  }, [event, keyRef, handlerRef]);
}

const DEFAULT_CLICK_AWAY_EVENTS = ["mousedown", "touchstart"];

export function useClickAway(
  ref,
  onClickAway,
  events = DEFAULT_CLICK_AWAY_EVENTS,
) {
  const handlerRef = useLatest(onClickAway);
  const eventsKey = events.join(" ");

  useEffect(() => {
    const names = eventsKey.split(" ");
    const listener = (event) => {
      const el = ref.current;
      if (el && !el.contains(event.target)) handlerRef.current(event);
    };
    names.forEach((name) => document.addEventListener(name, listener));
    return () =>
      names.forEach((name) => document.removeEventListener(name, listener));
  }, [eventsKey, ref, handlerRef]);
}

// Counted so stacked modals restore the original overflow only once.
let bodyLockCount = 0;
let bodyOverflowBeforeLock = "";

export function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const { style } = document.body;
    if (bodyLockCount === 0) {
      bodyOverflowBeforeLock = style.overflow;
      style.overflow = "hidden";
    }
    bodyLockCount += 1;
    return () => {
      bodyLockCount -= 1;
      if (bodyLockCount === 0) style.overflow = bodyOverflowBeforeLock;
    };
  }, [locked]);
}

export function useMedia(query) {
  const subscribe = useCallback(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function subscribeResize(onChange) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

export function useWindowHeight() {
  return useSyncExternalStore(
    subscribeResize,
    () => window.innerHeight,
    () => 0,
  );
}

// Safari < 16.4 only has the webkit-prefixed Fullscreen API.
function getFullscreenElement() {
  return document.fullscreenElement ?? document.webkitFullscreenElement ?? null;
}

function exitFullscreen() {
  const exit = document.exitFullscreen ?? document.webkitExitFullscreen;
  return Promise.resolve(exit?.call(document)).catch(() => {});
}

// Puts ref.current in fullscreen while enabled; onClose fires when the user
// leaves fullscreen (Esc, browser UI) or the request fails.
export function useFullscreen(ref, enabled, { onClose } = {}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const onCloseRef = useLatest(onClose);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return undefined;

    const request = el.requestFullscreen ?? el.webkitRequestFullscreen;
    if (!request) {
      onCloseRef.current?.();
      return undefined;
    }

    const onChange = () => {
      const active = getFullscreenElement() !== null;
      setIsFullscreen(active);
      if (!active) onCloseRef.current?.();
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);

    setIsFullscreen(true);
    Promise.resolve(request.call(el)).catch(() => {
      setIsFullscreen(false);
      onCloseRef.current?.();
    });

    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
      setIsFullscreen(false);
      if (getFullscreenElement()) exitFullscreen();
    };
  }, [enabled, ref, onCloseRef]);

  return isFullscreen;
}
