/**
 * Applies a tuning system + string count + resolved tuning array, in the
 * order that avoids a real race in `useMergedPresets.js`: switching
 * `systemId` there triggers an effect that re-queues the *default* preset
 * for the new system, which can clobber an explicit preset selection made
 * too early. Setting the tuning array directly (not via `setPreset`) sidesteps
 * that entirely — the actual notes are correct immediately regardless of
 * what the preset-selection bookkeeping resolves to afterward.
 *
 * `setTuningAtomic` (falling back to `setTuning`) is used for the tuning
 * write so the store's `tuningAtomicEpoch` bumps alongside it — that's how
 * `useInstrumentConfig`/`useMergedPresets` distinguish this atomic apply
 * from any other tuning write that happens to land in the same render as a
 * systemId/strings change (e.g. `useStringsChange`), which must still fall
 * back to the system's default tuning rather than being skipped.
 *
 * If the caller also wants to update which preset name shows as "selected"
 * (e.g. `instrumentDomain.presets.setPreset`), call it strictly *after* this
 * returns, never interleaved with these three calls.
 */
export function applyResolvedTuning({
  setSystemId,
  setStrings,
  setTuning,
  setTuningAtomic,
  systemId,
  strings,
  tuning,
}: {
  setSystemId?: (systemId: string) => void;
  setStrings?: (strings: number) => void;
  setTuning?: (tuning: unknown[]) => void;
  setTuningAtomic?: (tuning: unknown[]) => void;
  systemId: string;
  strings: number;
  tuning?: unknown[] | null;
}): void {
  setSystemId?.(systemId);
  setStrings?.(strings);
  if (tuning) {
    const applyTuning = setTuningAtomic ?? setTuning;
    applyTuning?.([...tuning]);
  }
}
