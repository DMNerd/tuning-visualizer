import { useCallback } from "react";
import { useSystemState } from "@/hooks/useSystemState";
import { useChordLogic } from "@/hooks/useChordLogic";
import { useScaleOptions } from "@/hooks/useScaleOptions";
import { buildTheoryDomainReturn } from "@/app/hooks/domainReturnBuilders";

export function useTheoryDomain({
  tunings,
  defaultSystemId,
  defaultRoot,
  accidental,
  allScales,
  defaultScale,
}) {
  const {
    systemId,
    setSystemId,
    system,
    root,
    setRoot,
    pcFromName,
    nameForPc,
    sysNames,
    rootIx,
  } = useSystemState({
    tunings,
    defaultSystemId,
    defaultRoot,
    accidental,
  });

  const chord = useChordLogic(system, pcFromName);
  const { scale, setScale, scaleOptions, intervals } = useScaleOptions({
    system,
    ALL_SCALES: allScales,
    initial: defaultScale,
  });

  const handleSelectNote = useCallback(
    (pc, providedName, event) => {
      const noteName = providedName ?? nameForPc(pc);
      if (!noteName || !sysNames.includes(noteName)) return;

      if (event?.type === "contextmenu" || event?.button === 2) {
        event?.preventDefault?.();
        chord.setChordRoot?.(noteName);
        return;
      }

      setRoot(noteName);
    },
    [nameForPc, sysNames, chord, setRoot],
  );

  return buildTheoryDomainReturn({
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
    chord,
    handlers: {
      handleSelectNote,
    },
  });
}
