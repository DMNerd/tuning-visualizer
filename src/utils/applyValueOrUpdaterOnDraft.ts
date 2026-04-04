type ValueOrUpdater<T> = T | ((draft: T) => T | void);

export function applyValueOrUpdaterOnDraft<
  Container extends Record<string, unknown>,
  Key extends keyof Container,
>(
  draftContainer: Container,
  key: Key,
  valueOrUpdater: ValueOrUpdater<Container[Key]>,
): void {
  if (typeof valueOrUpdater === "function") {
    const updater = valueOrUpdater as (draft: Container[Key]) => Container[Key] | void;
    const next = updater(draftContainer[key]);
    if (next !== undefined) {
      draftContainer[key] = next;
    }
    return;
  }

  draftContainer[key] = valueOrUpdater;
}
