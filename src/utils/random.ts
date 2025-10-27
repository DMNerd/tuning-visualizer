export type ScaleOptionLike = {
  label: string;
};

export type PickRandomScaleArgs = {
  sysNames?: string[] | null;
  scaleOptions?: ScaleOptionLike[] | null;
};

export type PickRandomScaleResult = {
  root: string;
  scale: string;
};

export function pickRandomItem<T>(items?: readonly T[] | null): T | null {
  if (!items || items.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * items.length);
  const nextItem = items[index];

  return nextItem ?? null;
}

export function pickRandomScale({
  sysNames,
  scaleOptions,
}: PickRandomScaleArgs): PickRandomScaleResult | null {
  const nextRoot = pickRandomItem(sysNames);
  const nextScaleOption = pickRandomItem(scaleOptions);

  if (typeof nextRoot !== "string") {
    return null;
  }

  if (!nextScaleOption || typeof nextScaleOption.label !== "string") {
    return null;
  }

  return {
    root: nextRoot,
    scale: nextScaleOption.label,
  };
}
