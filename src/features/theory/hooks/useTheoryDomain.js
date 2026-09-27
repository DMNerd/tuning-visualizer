import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { migrateScaleLabel, scalesForSystem } from "@domain/theory/scales";
import {
  buildChordPCsFromPc,
  isMicrotonalChordType,
} from "@domain/theory/chords";
import { CHORD_DEFAULT, ROOT_DEFAULT } from "@shared/config/appDefaults";
import { supportsMicrotonal } from "@domain/theory/tonalAdapter";
import { resolveCapoRelativeChordRootPc } from "@domain/theory/capoChords";

import { useSystemNoteNames } from "@features/theory/hooks/useSystemNoteNames";
import { buildTheoryDomainReturn } from "@shared/lib/domainReturnBuilders";
import {
  useTheoryStore,
  selectTheoryActions,
  selectTheoryChordCapoRelative,
  selectTheoryChordFinderActive,
  selectTheoryChordIgnoresScale,
  selectTheoryChordRoot,
  selectTheoryChordType,
  selectTheoryHideNonChord,
  selectTheoryIsHydrated,
  selectTheoryPickedPcs,
  selectTheoryRoot,
  selectTheoryScale,
  selectTheoryShowChord,
  selectTheorySystemId,
} from "@features/theory/store/useTheoryStore";

const selectTheoryDomainStore = (state) => ({
  systemId: selectTheorySystemId(state),
  root: selectTheoryRoot(state),
  scale: selectTheoryScale(state),
  chordRoot: selectTheoryChordRoot(state),
  chordType: selectTheoryChordType(state),
  showChord: selectTheoryShowChord(state),
  hideNonChord: selectTheoryHideNonChord(state),
  chordCapoRelative: selectTheoryChordCapoRelative(state),
  chordIgnoresScale: selectTheoryChordIgnoresScale(state),
  chordFinderActive: selectTheoryChordFinderActive(state),
  pickedPcs: selectTheoryPickedPcs(state),
  isHydrated: selectTheoryIsHydrated(state),
  ...selectTheoryActions(state),
});

export function useTheoryDomain({
  tunings,
  defaultSystemId,
  defaultRoot,
  accidental,
  noteNaming,
  defaultScale,
}) {
  const theoryStore = useTheoryStore(useShallow(selectTheoryDomainStore));
  const {
    systemId,
    root,
    scale,
    chordRoot,
    chordType,
    showChord,
    hideNonChord,
    chordCapoRelative,
    chordIgnoresScale,
    chordFinderActive,
    pickedPcs,
    isHydrated,
    setSystemId,
    setRoot,
    setScale,
    setChordRoot,
    setChordType,
    setShowChord,
    setHideNonChord,
    setChordCapoRelative,
    setChordIgnoresScale,
    setChordFinderActive,
    togglePickedPc,
    clearPickedPcs,
    resetTheory,
  } = theoryStore;

  const system = useMemo(
    () => tunings[systemId] ?? tunings[defaultSystemId],
    [tunings, systemId, defaultSystemId],
  );

  useEffect(() => {
    if (!tunings?.[systemId] && defaultSystemId) {
      setSystemId(defaultSystemId);
    }
  }, [tunings, systemId, defaultSystemId, setSystemId]);

  const { pcFromName, nameForPc, sysNames } = useSystemNoteNames(
    system,
    accidental,
    noteNaming,
  );

  useEffect(() => {
    if (!Array.isArray(sysNames) || !sysNames.length) return;

    setRoot((prev) => {
      const current = prev ?? defaultRoot ?? ROOT_DEFAULT;
      if (sysNames.includes(current)) return current;

      const currentPc = pcFromName(current);
      if (Number.isFinite(currentPc)) {
        const normalizedCurrent = nameForPc(currentPc);
        if (sysNames.includes(normalizedCurrent)) return normalizedCurrent;
      }

      if (defaultRoot) {
        if (sysNames.includes(defaultRoot)) return defaultRoot;
        const defaultPc = pcFromName(defaultRoot);
        if (Number.isFinite(defaultPc)) {
          const normalizedDefault = nameForPc(defaultPc);
          if (sysNames.includes(normalizedDefault)) return normalizedDefault;
        }
      }

      return sysNames[0];
    });
  }, [setRoot, sysNames, defaultRoot, pcFromName, nameForPc]);

  const scaleOptions = useMemo(() => {
    if (!system?.id || typeof system.divisions !== "number") return [];
    return scalesForSystem(system.id, system.divisions);
  }, [system]);

  useEffect(() => {
    if (!scaleOptions.length) return;
    const isOffered = (label) =>
      scaleOptions.some((candidate) => candidate.label === label);
    if (isOffered(scale)) return;
    // A label saved by an older version may have been renamed
    const migrated = migrateScaleLabel(scale);
    if (isOffered(migrated)) setScale(migrated);
    else setScale(defaultScale || scaleOptions[0].label);
  }, [scaleOptions, scale, setScale, defaultScale]);

  const intervals = useMemo(() => {
    const definition = scaleOptions.find(
      (candidate) => candidate.label === scale,
    );
    return definition?.pcs ?? (scaleOptions[0]?.pcs || []);
  }, [scaleOptions, scale]);

  const rootIx = pcFromName(root);
  const chordRootIx = useMemo(
    () => pcFromName(chordRoot),
    [chordRoot, pcFromName],
  );

  const chordTonePcs = useMemo(
    () => buildChordPCsFromPc(chordRootIx, chordType, system.divisions),
    [chordRootIx, chordType, system.divisions],
  );

  const chordOverlayPcs = showChord ? chordTonePcs : null;

  useEffect(() => {
    if (supportsMicrotonal(system.divisions)) return;
    if (!isMicrotonalChordType(chordType)) return;
    setChordType(CHORD_DEFAULT);
  }, [system.divisions, chordType, setChordType]);

  // Picked pitch classes are only meaningful within one division count.
  useEffect(() => {
    clearPickedPcs();
  }, [system.divisions, clearPickedPcs]);

  const handleSelectNote = useCallback(
    (pc, providedName, event, selectionContext = {}) => {
      const isChordRootSelection =
        event?.type === "contextmenu" || event?.button === 2;
      if (chordFinderActive && !isChordRootSelection) {
        togglePickedPc(pc);
        return;
      }
      const notePc = isChordRootSelection
        ? resolveCapoRelativeChordRootPc({
            pc,
            capoFret: selectionContext?.capoFret,
            chordCapoRelative,
            divisions: system.divisions,
          })
        : pc;
      const noteName =
        isChordRootSelection || notePc !== pc
          ? nameForPc(notePc)
          : (providedName ?? nameForPc(notePc));
      if (!noteName || !sysNames.includes(noteName)) return;

      if (isChordRootSelection) {
        event?.preventDefault?.();
        setChordRoot(noteName);
        return;
      }

      setRoot(noteName);
    },
    [
      chordCapoRelative,
      chordFinderActive,
      togglePickedPc,
      nameForPc,
      sysNames,
      setChordRoot,
      setRoot,
      system.divisions,
    ],
  );

  const theoryDomain = useMemo(
    () =>
      buildTheoryDomainReturn({
        system: {
          systemId,
          setSystemId,
          system,
          rootIx,
          nameForPc,
          sysNames,
          root,
          setRoot,
          pcFromName,
        },
        scale: {
          scale,
          setScale,
          scaleOptions,
          intervals,
          defaultScale,
        },
        chord: {
          chordRoot,
          setChordRoot,
          chordType,
          setChordType,
          showChord,
          setShowChord,
          hideNonChord,
          setHideNonChord,
          chordCapoRelative,
          setChordCapoRelative,
          chordIgnoresScale,
          setChordIgnoresScale,
          chordFinderActive,
          setChordFinderActive,
          pickedPcs,
          togglePickedPc,
          clearPickedPcs,
          resetTheory,
          chordRootIx,
          chordOverlayPcs,
          chordTonePcs,
        },
        hydration: { isHydrated },
        handlers: { handleSelectNote },
      }),
    [
      systemId,
      setSystemId,
      system,
      rootIx,
      nameForPc,
      sysNames,
      root,
      setRoot,
      pcFromName,
      scale,
      setScale,
      scaleOptions,
      intervals,
      defaultScale,
      chordRoot,
      setChordRoot,
      chordType,
      setChordType,
      showChord,
      setShowChord,
      hideNonChord,
      setHideNonChord,
      chordCapoRelative,
      setChordCapoRelative,
      chordIgnoresScale,
      setChordIgnoresScale,
      chordFinderActive,
      setChordFinderActive,
      pickedPcs,
      togglePickedPc,
      clearPickedPcs,
      resetTheory,
      chordRootIx,
      chordOverlayPcs,
      chordTonePcs,
      isHydrated,
      handleSelectNote,
    ],
  );

  return theoryDomain;
}
