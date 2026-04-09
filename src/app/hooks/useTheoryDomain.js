import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { buildBaselineScalesForSystem } from "@/lib/theory/scales";
import {
  buildChordPCsFromPc,
  isMicrotonalChordType,
} from "@/lib/theory/chords";
import { CHORD_DEFAULT, ROOT_DEFAULT } from "@/lib/config/appDefaults";

import { useSystemNoteNames } from "@/hooks/useSystemNoteNames";
import { buildTheoryDomainReturn } from "@/app/hooks/domainReturnBuilders";
import {
  useTheoryStore,
  selectTheoryActions,
  selectTheoryChordRoot,
  selectTheoryChordType,
  selectTheoryHideNonChord,
  selectTheoryRoot,
  selectTheoryScale,
  selectTheoryShowChord,
  selectTheorySystemId,
} from "@/stores/useTheoryStore";

export function useTheoryDomain({
  tunings,
  defaultSystemId,
  defaultRoot,
  accidental,
  noteNaming,
  allScales,
  defaultScale,
}) {
  const systemId = useTheoryStore(selectTheorySystemId);
  const root = useTheoryStore(selectTheoryRoot);
  const scale = useTheoryStore(selectTheoryScale);
  const chordRoot = useTheoryStore(selectTheoryChordRoot);
  const chordType = useTheoryStore(selectTheoryChordType);
  const showChord = useTheoryStore(selectTheoryShowChord);
  const hideNonChord = useTheoryStore(selectTheoryHideNonChord);
  const {
    setSystemId,
    setRoot,
    setScale,
    setChordRoot,
    setChordType,
    setShowChord,
    setHideNonChord,
  } = useTheoryStore(useShallow(selectTheoryActions));

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
    (pc, providedName, event) => {
      const noteName = providedName ?? nameForPc(pc);
      if (!noteName || !sysNames.includes(noteName)) return;

      if (event?.type === "contextmenu" || event?.button === 2) {
        event?.preventDefault?.();
        setChordRoot(noteName);
        return;
      }

      setRoot(noteName);
    },
    [nameForPc, sysNames, setChordRoot, setRoot],
  );

  const systemSlice = useMemo(
    () => ({
      systemId,
      setSystemId,
      system,
      rootIx,
      nameForPc,
      sysNames,
      root,
      setRoot,
      pcFromName,
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
    ],
  );

  const scaleSlice = useMemo(
    () => ({
      scale,
      setScale,
      scaleOptions,
      intervals,
      defaultScale,
    }),
    [scale, setScale, scaleOptions, intervals, defaultScale],
  );

  const chordSlice = useMemo(
    () => ({
      chordRoot,
      setChordRoot,
      chordType,
      setChordType,
      showChord,
      setShowChord,
      hideNonChord,
      setHideNonChord,
      chordRootIx,
      chordOverlayPcs,
      chordTonePcs,
    }),
    [
      chordRoot,
      setChordRoot,
      chordType,
      setChordType,
      showChord,
      setShowChord,
      hideNonChord,
      setHideNonChord,
      chordRootIx,
      chordOverlayPcs,
      chordTonePcs,
    ],
  );

  const handlersSlice = useMemo(
    () => ({
      handleSelectNote,
    }),
    [handleSelectNote],
  );

  const theoryDomain = useMemo(
    () =>
      buildTheoryDomainReturn({
        system: systemSlice,
        scale: scaleSlice,
        chord: chordSlice,
        handlers: handlersSlice,
      }),
    [systemSlice, scaleSlice, chordSlice, handlersSlice],
  );

  return theoryDomain;
}
