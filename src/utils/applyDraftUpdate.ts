export type ValueOrUpdater<T> = T | ((draft: T) => T | void);

export function applyDraftUpdate<T>(
  prevState: T,
  valueOrUpdater: ValueOrUpdater<T>,
): T {
  if (typeof valueOrUpdater === "function") {
    const updater = valueOrUpdater as (draft: T) => T | void;
    const draft = structuredClone(prevState);
    const next = updater(draft);
    return next === undefined ? draft : next;
  }

  return valueOrUpdater;
}
