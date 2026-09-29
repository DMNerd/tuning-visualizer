import { normalizeCapoFret } from "@domain/theory/capoChords";
import i18n from "@shared/i18n";

export function buildCapoChordDisplay({
  chordCapoRelative = false,
  capoFret = 0,
  isChordTransposed = false,
  originalChordRoot,
  transposedChordRoot,
  root,
  chordTypeLabel,
  t = i18n.t,
}) {
  const shapeRoot = originalChordRoot ?? root;
  const soundingRoot = transposedChordRoot ?? shapeRoot;
  const shapeChordLabel = `${shapeRoot} ${chordTypeLabel}`;
  const soundingChordLabel = `${soundingRoot} ${chordTypeLabel}`;
  const safeCapoFret = normalizeCapoFret(capoFret);
  const hasActiveTransposition = safeCapoFret > 0 && isChordTransposed;

  return {
    shapeChordLabel,
    soundingChordLabel,
    safeCapoFret,
    hasActiveTransposition,
    helpText: chordCapoRelative
      ? safeCapoFret > 0
        ? t("theory.capoHelpRelative")
        : t("theory.capoHelpNoCapo")
      : safeCapoFret > 0
        ? t("theory.capoHelpUseRelative", { fret: safeCapoFret })
        : t("theory.capoHelpEnable"),
    summaryText: hasActiveTransposition
      ? t("theory.capoSummary", {
          shape: shapeChordLabel,
          sounding: soundingChordLabel,
          fret: safeCapoFret,
        })
      : t("theory.capoSummaryNoCapo"),
    ariaLabel: t(
      hasActiveTransposition ? "theory.capoAria" : "theory.capoAriaNoCapo",
      {
        shape: shapeChordLabel,
        sounding: soundingChordLabel,
        fret: safeCapoFret,
      },
    ),
  };
}
