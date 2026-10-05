import { useMemo, useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useLatest, useMountedState, usePrevious, useUpdateEffect } from "@shared/hooks/stateHooks";
import { normalizePresetMeta } from "@domain/meta/meta";
import {
  applyNeckFilterModeToBoardMeta,
  NECK_FILTER_MODES,
  resolvePresetNeckFilterMode,
  resolveNeckFilterModeIntentFromBoardMeta,
} from "@domain/presets/neckFilterModes";
import {
  areTuningsEqual,
  filterCompatibleCustoms,
  findPackByName,
  omitReservedPresetNames,
} from "@features/instrument/model/presetMerging";
import { applyResolvedTuning } from "@shared/lib/applyResolvedTuning";
import { useTuningWasSetAtomically } from "@features/instrument/hooks/useTuningAtomicEpoch";
import {
  coerceAnyTuning,
  usePresetBuilder,
} from "@features/instrument/hooks/usePresetBuilder";
import {
  useInstrumentWorkflowStore,
  selectInstrumentWorkflowActions,
  selectWorkflowQueuedPresetName,
  selectWorkflowSelectedPreset,
} from "@features/instrument/store/useInstrumentWorkflowStore";

export function useMergedPresets({
  presetMap,
  presetMetaMap,
  customTunings,
  setTuning,
  setTuningAtomic,
  setStrings,
  setStringMeta,
  setBoardMeta,
  currentEdo,
  currentStrings,
  currentTuning,
  tuningAtomicEpoch,
  systemId,
  strings,
  savedExists,
  onInstrumentChange,
  neckFilterMode = NECK_FILTER_MODES.NONE,
  setNeckFilterMode,
}) {
  const isMounted = useMountedState();
  const onInstrumentChangeRef = useLatest(onInstrumentChange);
  const currentTuningRef = useLatest(currentTuning);

  const compatibleCustoms = useMemo(
    () => filterCompatibleCustoms(customTunings, currentEdo, currentStrings),
    [customTunings, currentEdo, currentStrings],
  );

  const customPresetNames = useMemo(
    () =>
      compatibleCustoms
        .map((c) => (typeof c?.name === "string" ? c.name : null))
        .filter(Boolean),
    [compatibleCustoms],
  );

  const factoryPreset = useMemo(
    () => presetMap?.["Factory default"] ?? null,
    [presetMap],
  );

  const savedPreset = useMemo(
    () => presetMap?.["Saved default"] ?? null,
    [presetMap],
  );

  const savedPresetMeta = useMemo(
    () => presetMetaMap?.["Saved default"] ?? null,
    [presetMetaMap],
  );

  const catalogPresets = useMemo(
    () => omitReservedPresetNames(presetMap),
    [presetMap],
  );

  const catalogMeta = useMemo(
    () => omitReservedPresetNames(presetMetaMap),
    [presetMetaMap],
  );

  const {
    presetMap: mergedPresetMap,
    presetMetaMap: mergedPresetMetaMap,
    presetNames: mergedPresetNames,
  } = usePresetBuilder({
    factory: factoryPreset,
    saved: savedPreset,
    savedMeta: savedPresetMeta,
    catalogPresets,
    catalogMeta,
    customPacks: compatibleCustoms,
  });

  const defaultPresetName = useMemo(
    () => (savedExists ? "Saved default" : "Factory default"),
    [savedExists],
  );

  const selectedPreset = useInstrumentWorkflowStore(
    selectWorkflowSelectedPreset,
  );
  const queuedPresetName = useInstrumentWorkflowStore(
    selectWorkflowQueuedPresetName,
  );
  const { setSelectedPreset, setQueuedPresetName } = useInstrumentWorkflowStore(
    useShallow(selectInstrumentWorkflowActions),
  );

  const resolveTuningByName = useCallback(
    (name) => {
      if (!name) return null;
      const fromMerged = coerceAnyTuning(mergedPresetMap?.[name]);
      if (fromMerged?.length) return fromMerged;
      const fromPack = findPackByName(compatibleCustoms, name);
      return fromPack ? coerceAnyTuning(fromPack) : null;
    },
    [mergedPresetMap, compatibleCustoms],
  );

  // Neck filter mode applied by the last explicitly selected preset's meta.
  const presetAppliedModeRef = useRef(null);

  const setPreset = useCallback(
    (name, options = {}) => {
      // syncNeckFilterFromPresetMeta=true when user selects a preset so preset
      // metadata can set the mode; false when reapplying after manual mode
      // toggles so we preserve the user's current mode choice.
      const { syncNeckFilterFromPresetMeta = true } = options;
      if (typeof name !== "string" || !name) return;
      if (!isMounted()) return;
      if (selectedPreset !== name) {
        setSelectedPreset(name);
      }
      const coerced = resolveTuningByName(name);
      if (!coerced?.length) {
        setQueuedPresetName(name);
        return;
      }
      if (
        Array.isArray(coerced) &&
        Number.isFinite(currentStrings) &&
        coerced.length !== currentStrings
      ) {
        return;
      }
      if (!areTuningsEqual(currentTuningRef.current, coerced)) {
        setTuning(coerced);
      }
      // Consumers of the store's stringMeta expect an array, not the Map form.
      const metaSource =
        mergedPresetMetaMap?.[name] ??
        findPackByName(compatibleCustoms, name)?.meta;
      const meta = normalizePresetMeta(metaSource, {
        stringMetaFormat: "array",
      });
      setStringMeta(meta?.stringMeta || null);

      const presetMode = resolveNeckFilterModeIntentFromBoardMeta(meta?.board);
      const resolvedNeckFilterMode = resolvePresetNeckFilterMode({
        presetMode,
        syncFromPresetMeta: syncNeckFilterFromPresetMeta,
        currentMode: neckFilterMode,
        presetAppliedMode: presetAppliedModeRef.current,
        currentEdo,
        boardMeta: meta?.board ?? null,
      });
      setNeckFilterMode?.(resolvedNeckFilterMode);
      if (syncNeckFilterFromPresetMeta) {
        presetAppliedModeRef.current = presetMode
          ? resolvedNeckFilterMode
          : null;
      }

      const nextBoardMeta = applyNeckFilterModeToBoardMeta(meta?.board, {
        mode: resolvedNeckFilterMode,
        edo: currentEdo,
        strings: currentStrings,
      });
      setBoardMeta(nextBoardMeta || null);
      setQueuedPresetName(null);
    },
    [
      isMounted,
      resolveTuningByName,
      mergedPresetMetaMap,
      compatibleCustoms,
      setTuning,
      setStringMeta,
      setBoardMeta,
      currentStrings,
      currentEdo,
      neckFilterMode,
      setNeckFilterMode,
      currentTuningRef,
      selectedPreset,
      setSelectedPreset,
      setQueuedPresetName,
    ],
  );

  // Selects a catalog entry that may belong to a different string count. For
  // other counts the strings + tuning are switched atomically and the name is
  // queued, so the queued-preset effect applies its meta once the merged map
  // for the new count exists.
  const selectPresetEntry = useCallback(
    (entry) => {
      const name = entry?.name;
      if (typeof name !== "string" || !name) return;
      const entryStrings = Number(entry.strings);
      const isOtherCount =
        Number.isFinite(entryStrings) &&
        Number.isFinite(currentStrings) &&
        entryStrings !== currentStrings;
      if (!isOtherCount || !Array.isArray(entry.tuning)) {
        setPreset(name);
        return;
      }
      if (!isMounted()) return;
      applyResolvedTuning({
        setStrings,
        setTuning,
        setTuningAtomic,
        systemId,
        strings: entryStrings,
        tuning: entry.tuning,
      });
      setSelectedPreset(name);
      setQueuedPresetName(name);
    },
    [
      currentStrings,
      isMounted,
      setPreset,
      setStrings,
      setTuning,
      setTuningAtomic,
      systemId,
      setSelectedPreset,
      setQueuedPresetName,
    ],
  );

  const resetSelection = useCallback(() => {
    const nextPreset = defaultPresetName || "Factory default";
    if (selectedPreset !== nextPreset) {
      setSelectedPreset(nextPreset);
    }
  }, [defaultPresetName, selectedPreset, setSelectedPreset]);

  const queuePresetByName = useCallback(
    (name) => {
      if (typeof name !== "string" || !name) return;
      const resolved = resolveTuningByName(name);
      if (resolved?.length) {
        setPreset(name);
        return;
      }
      setQueuedPresetName(name);
    },
    [resolveTuningByName, setPreset, setQueuedPresetName],
  );

  useEffect(() => {
    if (!selectedPreset) return;
    if (queuedPresetName === selectedPreset) return;
    const resolved = resolveTuningByName(selectedPreset);
    if (resolved?.length) {
      setPreset(selectedPreset);
    }
  }, [
    mergedPresetMap,
    resolveTuningByName,
    selectedPreset,
    queuedPresetName,
    setPreset,
  ]);

  useUpdateEffect(() => {
    if (!selectedPreset) return;
    if (mergedPresetNames.includes(selectedPreset)) return;

    resetSelection();

    if (defaultPresetName && mergedPresetNames.includes(defaultPresetName)) {
      queuePresetByName(defaultPresetName);
      return;
    }

    const fallback = mergedPresetNames[0];
    if (fallback) {
      queuePresetByName(fallback);
    }
  }, [
    mergedPresetNames,
    selectedPreset,
    defaultPresetName,
    resetSelection,
    queuePresetByName,
  ]);

  useUpdateEffect(() => {
    if (!selectedPreset) return;
    const resolved = resolveTuningByName(selectedPreset);
    if (!resolved?.length) return;
    setPreset(selectedPreset, { syncNeckFilterFromPresetMeta: false });
  }, [
    neckFilterMode,
    currentEdo,
    currentStrings,
    selectedPreset,
    resolveTuningByName,
    setPreset,
  ]);

  useUpdateEffect(() => {
    const pending = queuedPresetName;
    if (!pending) return;
    const resolved = resolveTuningByName(pending);
    if (resolved?.length) {
      setPreset(pending);
      setQueuedPresetName(null);
    }
  }, [
    mergedPresetNames,
    mergedPresetMap,
    queuedPresetName,
    resolveTuningByName,
    setPreset,
    setQueuedPresetName,
  ]);

  const prevSystemId = usePrevious(systemId);
  const prevStrings = usePrevious(strings);
  const tuningWasSetAtomically = useTuningWasSetAtomically(tuningAtomicEpoch);

  useUpdateEffect(() => {
    const instrumentChanged =
      prevSystemId !== systemId || prevStrings !== strings;
    if (!instrumentChanged) return;
    if (typeof onInstrumentChangeRef.current === "function") {
      setStringMeta(null);
      setBoardMeta(null);
      onInstrumentChangeRef.current({
        queuePresetByName,
        resetSelection,
        defaultPresetName,
      });
      return;
    }
    // Skip resetting to the default preset (which would overwrite the
    // tuning via setPreset) if the tuning was *also* explicitly set
    // atomically alongside this system/strings change via setTuningAtomic
    // — e.g. applyResolvedTuning applying a specific preset. The caller owns
    // string/board meta in that case too (the queued preset or share payload
    // sets it), so don't clear what an earlier effect in this commit applied.
    if (tuningWasSetAtomically) return;
    setStringMeta(null);
    setBoardMeta(null);
    resetSelection();
    if (defaultPresetName) {
      queuePresetByName(defaultPresetName);
    }
  }, [
    systemId,
    strings,
    prevSystemId,
    prevStrings,
    tuningWasSetAtomically,
    queuePresetByName,
    resetSelection,
    defaultPresetName,
    setStringMeta,
    setBoardMeta,
    onInstrumentChangeRef,
  ]);

  return useMemo(
    () => ({
      mergedPresetMap,
      mergedPresetMetaMap,
      mergedPresetNames,
      customPresetNames,
      selectedPreset,
      setPreset,
      selectPresetEntry,
      resetSelection,
      queuePresetByName,
    }),
    [
      mergedPresetMap,
      mergedPresetMetaMap,
      mergedPresetNames,
      customPresetNames,
      selectedPreset,
      setPreset,
      selectPresetEntry,
      resetSelection,
      queuePresetByName,
    ],
  );
}
