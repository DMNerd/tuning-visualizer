import { memo, type ComponentType } from "react";
import { dequal } from "dequal";

export function memoWithPick<P>(
  Component: ComponentType<P>,
  pick: (props: P) => unknown,
) {
  return memo(Component, (prev, next) => dequal(pick(prev), pick(next)));
}

type AnyRecord = Record<string, unknown>;

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
  return memoWithPick(Component, (props) => ({
    state: props.state,
    actions: props.actions,
    meta: props.meta,
  }));
}

export default memoWithPick;
