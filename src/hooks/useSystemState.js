import { useEffect, useMemo } from "react";
import { useSystemPrefs } from "@/hooks/useSystemPrefs";
import { useSystemNoteNames } from "@/hooks/useSystemNoteNames";

export function useSystemState({
  tunings,
  defaultSystemId,
  defaultRoot,
  accidental,
}) {
  const { systemId, setSystemId, root, setRoot, ensureValidRoot } =
    useSystemPrefs({
      tunings,
      defaultSystemId,
      defaultRoot,
    });

  const system = useMemo(() => tunings[systemId], [systemId, tunings]);

  const { pcFromName, nameForPc, sysNames } = useSystemNoteNames(
    system,
    accidental,
  );

  useEffect(() => {
    ensureValidRoot(sysNames);
  }, [ensureValidRoot, sysNames]);

  const rootIx = pcFromName(root);

  return {
    systemId,
    setSystemId,
    system,
    root,
    setRoot,
    pcFromName,
    nameForPc,
    sysNames,
    rootIx,
  };
}
