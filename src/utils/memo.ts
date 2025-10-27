import { memo } from "react";
import { dequal } from "dequal";

export function memoWithPick<P>(
  Component: React.ComponentType<P>,
  pick: (props: P) => unknown,
) {
  return memo(Component, (prev, next) => dequal(pick(prev), pick(next)));
}

export default memoWithPick;
