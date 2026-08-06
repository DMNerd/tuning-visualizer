import { usePrevious } from "react-use";

/**
 * Both useInstrumentConfig (the system/strings default-reset effect) and
 * useMergedPresets (the preset-resync effect) need to skip their own
 * "system/strings changed -> reset/resync" logic exactly when the tuning
 * was set atomically alongside that change (e.g. via applyResolvedTuning
 * applying a preset), rather than by an unrelated write that happens to
 * land in the same render (e.g. useStringsChange extending the array).
 *
 * tuningAtomicEpoch (from useInstrumentCoreStore) is bumped only by the
 * store's setTuningAtomic action. Comparing it against its previous value
 * tells the two call sites apart without relying on tuning reference
 * equality, which ordinary tuning writes also change.
 */
export function useTuningWasSetAtomically(tuningAtomicEpoch) {
  const prevTuningAtomicEpoch = usePrevious(tuningAtomicEpoch);
  return tuningAtomicEpoch !== prevTuningAtomicEpoch;
}
