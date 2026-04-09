import { memo, type ComponentType } from "react";
import { dequal } from "dequal";

export function memoWithPick<P>(
  Component: ComponentType<P>,
  pick: (props: P) => unknown,
) {
  return memo(Component, (prev, next) => dequal(pick(prev), pick(next)));
}

type AnyRecord = Record<string, unknown>;

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
