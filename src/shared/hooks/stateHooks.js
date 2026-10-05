import { useCallback, useEffect, useReducer, useRef } from "react";

// Ref that always holds the latest render's value, for stable callbacks.
export function useLatest(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export function usePrevious(value) {
  const ref = useRef(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export function useMountedState() {
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return useCallback(() => mountedRef.current, []);
}

// useEffect that skips the mount run. The flag resets on unmount so
// StrictMode's simulated remount also counts as a mount.
export function useUpdateEffect(effect, deps) {
  const isMountRef = useRef(true);

  useEffect(() => {
    if (isMountRef.current) {
      isMountRef.current = false;
      return undefined;
    }
    return effect();
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- caller owns deps
  }, deps);

  useEffect(
    () => () => {
      isMountRef.current = true;
    },
    [],
  );
}

function toggleReducer(state, next) {
  return typeof next === "boolean" ? next : !state;
}

// toggle() flips; toggle(true/false) sets. Non-boolean args (events) flip.
export function useToggle(initialValue) {
  return useReducer(toggleReducer, initialValue);
}

// Runs fn once deps have been stable for ms.
export function useDebounce(fn, ms, deps) {
  const fnRef = useLatest(fn);

  useEffect(() => {
    const id = setTimeout(() => fnRef.current(), ms);
    return () => clearTimeout(id);
    // eslint-disable-next-line @eslint-react/exhaustive-deps -- caller owns deps
  }, [...deps, ms]);
}
