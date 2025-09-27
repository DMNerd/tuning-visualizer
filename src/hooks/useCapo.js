import { useState, useMemo, useCallback } from "react";
import { CAPO_DEFAULT } from "@/lib/theory/constants";

/**
 * Manages capo state and derives per-string metadata that respects the capo.
 *
 * Inputs:
 *  - strings: number
 *  - stringMeta: Array<{ index: number, startFret?: number, greyBefore?: boolean }> | null
 *  - initialCapo: number (optional, defaults to CAPO_DEFAULT)
 *
 * Returns:
 *  - capoFret: number
 *  - setCapoFret(fret: number): void
 *  - toggleCapoAt(fret: number): void  // toggles off if the same fret is clicked again
 *  - effectiveStringMeta: same shape as stringMeta, enhanced to start at capo and grey before
 */
export function useCapo({ strings, stringMeta, initialCapo = CAPO_DEFAULT }) {
  const [capoFret, _setCapoFret] = useState(initialCapo);

  const setCapoFret = useCallback((fret) => {
    _setCapoFret(Number.isFinite(fret) ? Math.max(0, Math.floor(fret)) : 0);
  }, []);

  const toggleCapoAt = useCallback((fret) => {
    _setCapoFret((prev) => (prev === fret ? CAPO_DEFAULT : fret));
  }, []);

  const effectiveStringMeta = useMemo(() => {
    if (capoFret === 0) return stringMeta;
    if (!strings || strings <= 0) return stringMeta;

    const base = Array.isArray(stringMeta) ? stringMeta : [];
    const byIx = new Map(base.map((m) => [m.index, m]));

    const alreadyOk =
      base.length > 0 &&
      base.every((m) => {
        const sf = typeof m.startFret === "number" ? m.startFret : 0;
        return sf >= capoFret && (sf === 0 || m.greyBefore === true);
      });

    if (alreadyOk && base.length === strings) return stringMeta;

    const out = [];
    for (let i = 0; i < strings; i++) {
      const m = byIx.get(i) || {};
      const baseStart = typeof m.startFret === "number" ? m.startFret : 0;
      const nextStart = Math.max(baseStart, capoFret);

      if (nextStart > 0 || m.greyBefore) {
        out.push({
          index: i,
          ...m,
          startFret: nextStart,
          greyBefore: true,
        });
      } else if (Object.keys(m).length) {
        out.push({ index: i, ...m });
      }
    }

    return out.length ? out : null;
  }, [strings, stringMeta, capoFret]);

  return useMemo(
    () => ({ capoFret, setCapoFret, toggleCapoAt, effectiveStringMeta }),
    [capoFret, setCapoFret, toggleCapoAt, effectiveStringMeta],
  );
}
