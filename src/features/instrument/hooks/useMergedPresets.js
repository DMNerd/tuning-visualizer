import { useMemo, useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  usePrevious,
  useUpdateEffect,
  useLatest,
  useMountedState,
} from "react-use";
import { normalizePresetMeta } from "@domain/meta/meta";
import {
  applyNeckFilterModeToBoardMeta,
  NECK_FILTER_MODES,
  resolvePresetNeckFilterMode,
  resolveNeckFilterModeIntentFromBoardMeta,
} from "@domain/presets/neckFilterModes";
import { isPlainObject } from "@shared/lib/object";
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

const RESERVED_PRESET_NAMES = new Set(["Factory default", "Saved default"]);

function omitReservedPresetNames(map) {
  const out = {};
  for (const [name, value] of Object.entries(map || {})) {
    if (RESERVED_PRESET_NAMES.has(name)) continue;
    out[name] = value;
  }
  return out;
}

function areTuningsEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function useMergedPresets({
  presetMap,
  presetMetaMap,
  customTunings,
  setTuning,
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

  const compatibleCustoms = useMemo(() => {
    if (!Array.isArray(customTunings) || !customTunings.length) return [];
    const edo = Number(currentEdo);
    const sc = Number(currentStrings);
    return customTunings.filter((t) => {
      if (!isPlainObject(t) || !Array.isArray(t?.tuning?.strings)) {
        return false;
      }

      const tEdo = Number(t?.system?.edo);
      const tStrings = t.tuning.strings.length;
      const stringsMatch =
        Number.isFinite(sc) && Number.isFinite(tStrings)
          ? tStrings === sc
          : true;
      const edoMatch =
        Number.isFinite(edo) && Number.isFinite(tEdo) ? tEdo === edo : true;
      return stringsMatch && edoMatch;
    });
  }, [customTunings, currentEdo, currentStrings]);

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
      const fromPack = Array.isArray(compatibleCustoms)
        ? compatibleCustoms.find((p) => p?.name === name)
        : null;
      if (!fromPack) return null;
      return coerceAnyTuning(fromPack);
    },
    [mergedPresetMap, compatibleCustoms],
  );

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
      const meta =
        normalizePresetMeta(mergedPresetMetaMap?.[name]) ||
        normalizePresetMeta(
          (compatibleCustoms.find((p) => p?.name === name) || {})?.meta,
        );
      if (meta?.stringMeta) setStringMeta(meta.stringMeta);
      else setStringMeta(null);

      const presetMode = resolveNeckFilterModeIntentFromBoardMeta(meta?.board);
      const resolvedNeckFilterMode = resolvePresetNeckFilterMode({
        presetMode,
        syncFromPresetMeta: syncNeckFilterFromPresetMeta,
        currentMode: neckFilterMode,
        currentEdo,
        boardMeta: meta?.board ?? null,
      });
      setNeckFilterMode?.(resolvedNeckFilterMode);

      const nextBoardMeta = applyNeckFilterModeToBoardMeta(meta?.board, {
        mode: resolvedNeckFilterMode,
        edo: currentEdo,
        strings: currentStrings,
      });
      if (nextBoardMeta) setBoardMeta(nextBoardMeta);
      else setBoardMeta(null);
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
  const prevTuningAtomicEpoch = usePrevious(tuningAtomicEpoch);

  useUpdateEffect(() => {
    const instrumentChanged =
      prevSystemId !== systemId || prevStrings !== strings;
    if (!instrumentChanged) return;
    setStringMeta(null);
    setBoardMeta(null);
    if (typeof onInstrumentChangeRef.current === "function") {
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
    // — e.g. applyResolvedTuning applying a specific preset. This checks
    // the store's tuningAtomicEpoch rather than currentTuning reference
    // equality, since ordinary tuning writes (e.g. useStringsChange
    // extending the array) also produce a new reference and must still
    // resync the preset selection.
    if (tuningAtomicEpoch !== prevTuningAtomicEpoch) return;
    resetSelection();
    if (defaultPresetName) {
      queuePresetByName(defaultPresetName);
    }
  }, [
    systemId,
    strings,
    prevSystemId,
    prevStrings,
    tuningAtomicEpoch,
    prevTuningAtomicEpoch,
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
      resetSelection,
      queuePresetByName,
    ],
  );
}
