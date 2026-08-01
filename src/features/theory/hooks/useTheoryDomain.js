import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { buildBaselineScalesForSystem } from "@domain/theory/scales";
import {
  buildChordPCsFromPc,
  isMicrotonalChordType,
} from "@domain/theory/chords";
import { CHORD_DEFAULT, ROOT_DEFAULT } from "@shared/config/appDefaults";
import { resolveCapoRelativeChordRootPc } from "@domain/theory/capoChords";

import { useSystemNoteNames } from "@features/theory/hooks/useSystemNoteNames";
import { buildTheoryDomainReturn } from "@shared/lib/domainReturnBuilders";
import {
  useTheoryStore,
  selectTheoryActions,
  selectTheoryChordCapoRelative,
  selectTheoryChordRoot,
  selectTheoryChordType,
  selectTheoryHideNonChord,
  selectTheoryIsHydrated,
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
  isHydrated: selectTheoryIsHydrated(state),
  ...selectTheoryActions(state),
});

export function useTheoryDomain({
  tunings,
  defaultSystemId,
  defaultRoot,
  accidental,
  noteNaming,
  allScales,
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
    isHydrated,
    setSystemId,
    setRoot,
    setScale,
    setChordRoot,
    setChordType,
    setShowChord,
    setHideNonChord,
    setChordCapoRelative,
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
    if (!system?.id) return [];

    const matches = allScales.filter(
      (candidate) => candidate.systemId === system.id,
    );
    if (matches.length) return matches;

    if (typeof system.divisions === "number") {
      return buildBaselineScalesForSystem(system.id, system.divisions);
    }

    return [];
  }, [allScales, system]);

  useEffect(() => {
    if (!scaleOptions.length) return;
    const stillValid = scaleOptions.some(
      (candidate) => candidate.label === scale,
    );
    if (!stillValid) setScale(defaultScale || scaleOptions[0].label);
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

  const chordOverlayPcs = useMemo(
    () =>
      showChord
        ? buildChordPCsFromPc(chordRootIx, chordType, system.divisions)
        : null,
    [showChord, chordRootIx, chordType, system.divisions],
  );

  const chordTonePcs = useMemo(
    () => buildChordPCsFromPc(chordRootIx, chordType, system.divisions),
    [chordRootIx, chordType, system.divisions],
  );

  useEffect(() => {
    if (system.divisions === 24) return;
    if (!isMicrotonalChordType(chordType)) return;
    setChordType(CHORD_DEFAULT);
  }, [system.divisions, chordType, setChordType]);

  const handleSelectNote = useCallback(
    (pc, providedName, event, selectionContext = {}) => {
      const isChordRootSelection =
        event?.type === "contextmenu" || event?.button === 2;
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
