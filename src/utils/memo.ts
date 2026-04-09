import { memo, type ComponentType } from "react";

export function memoWithPick<P>(
  Component: ComponentType<P>,
  pick: (props: P) => unknown,
) {
  return memo(Component, (prev, next) =>
    pickedSliceEqual(pick(prev), pick(next)),
  );
}

type AnyRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is AnyRecord {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function pickedArrayEqual(prev: unknown[], next: unknown[]) {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i += 1) {
    if (!pickedSliceEqual(prev[i], next[i])) return false;
  }
  return true;
}

function pickedSetEqual(prev: Set<unknown>, next: Set<unknown>) {
  if (prev.size !== next.size) return false;
  for (const value of prev) {
    if (!next.has(value)) return false;
  }
  return true;
}

function pickedSliceEqual(prev: unknown, next: unknown): boolean {
  if (Object.is(prev, next)) return true;

  if (Array.isArray(prev) && Array.isArray(next)) {
    return pickedArrayEqual(prev, next);
  }

  if (prev instanceof Set && next instanceof Set) {
    return pickedSetEqual(prev, next);
  }

  if (isPlainObject(prev) && isPlainObject(next)) {
    return shallowEqualObjects(prev, next);
  }

  return false;
}

// Comparator guideline:
// Prefer primitive and reference checks first; use deep compare only when
// unavoidable for correctness.

function lengthOfArray(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function sizeOfSet(value: unknown) {
  return value instanceof Set ? value.size : 0;
}

export function arrayRefAndLengthEqual(
  prev: unknown[] | null | undefined,
  next: unknown[] | null | undefined,
) {
  return (
    Object.is(prev, next) && Object.is(lengthOfArray(prev), lengthOfArray(next))
  );
}

export function setRefAndSizeEqual<T>(
  prev: Set<T> | null | undefined,
  next: Set<T> | null | undefined,
) {
  return Object.is(prev, next) && Object.is(sizeOfSet(prev), sizeOfSet(next));
}

export function objectRefAndKeyEqual<
  T extends Record<string, unknown>,
  K extends keyof T,
>(prev: T | null | undefined, next: T | null | undefined, key: K) {
  return Object.is(prev, next) && Object.is(prev?.[key], next?.[key]);
}

function shallowEqualObjects(a: AnyRecord, b: AnyRecord) {
  if (a === b) return true;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}

export function memoWithShallowPick<P>(
  Component: ComponentType<P>,
  pick: (props: P) => AnyRecord,
) {
  return memo(Component, (prev, next) =>
    shallowEqualObjects(pick(prev), pick(next)),
  );
}

export function memoWithKeys<P extends AnyRecord>(
  Component: ComponentType<P>,
  keys: (keyof P)[],
) {
  return memo(Component, (prev, next) =>
    keys.every((key) => Object.is(prev[key], next[key])),
  );
}

type GroupedPanelProps = {
  state?: unknown;
  actions?: unknown;
  meta?: unknown;
};

export function memoPanel<P extends GroupedPanelProps>(
  Component: ComponentType<P>,
) {
  // Grouped panel props should rely on stable upstream references.
  // Keep comparator shallow/reference-first for predictable low-cost checks.
  return memoWithShallowPick(Component, (props) => ({
    state: props.state,
    actions: props.actions,
    meta: props.meta,
  }));
}

export default memoWithPick;
