import { useEffect, useMemo, useState } from "react";

/**
 * Filters scales for the active system, keeps selection valid,
 * and exposes the current scale's intervals.
 */
export function useScaleOptions({ system, ALL_SCALES, initial = "" }) {
  const scaleOptions = useMemo(
    () => ALL_SCALES.filter((s) => s.systemId === system.id),
    [ALL_SCALES, system.id],
  );

  const [scale, setScale] = useState(initial || (scaleOptions[0]?.label ?? ""));

  // if system changes and current scale becomes invalid, pick first available
  useEffect(() => {
    if (!scaleOptions.length) return;
    const stillValid = scaleOptions.some((s) => s.label === scale);
    if (!stillValid) setScale(scaleOptions[0].label);
  }, [scaleOptions, scale]);

  const intervals = useMemo(() => {
    const def = scaleOptions.find((s) => s.label === scale);
    return def?.pcs ?? (scaleOptions[0]?.pcs || []);
  }, [scaleOptions, scale]);

  return { scale, setScale, scaleOptions, intervals };
}
