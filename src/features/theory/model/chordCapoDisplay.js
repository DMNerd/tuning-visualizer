import { normalizeCapoFret } from "@domain/theory/capoChords";

export function buildCapoChordDisplay({
  chordCapoRelative = false,
  capoFret = 0,
  isChordTransposed = false,
  originalChordRoot,
  transposedChordRoot,
  root,
  chordTypeLabel,
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
        ? "Shape names are interpreted relative to the capo."
        : "No capo set; shape and sounding chord match."
      : safeCapoFret > 0
        ? `Use shape names relative to capo ${safeCapoFret}.`
        : "Enable to name chord roots as capo-relative shapes.",
    summaryText: hasActiveTransposition
      ? `Shape: ${shapeChordLabel} → Sounds: ${soundingChordLabel} (capo ${safeCapoFret})`
      : "No capo set; shape and sounding chord match",
    ariaLabel: hasActiveTransposition
      ? `Capo-relative chord mapping: shape ${shapeChordLabel}; sounds ${soundingChordLabel}; capo ${safeCapoFret}.`
      : `Capo-relative chord mapping: shape ${shapeChordLabel}; sounds ${soundingChordLabel}; no capo set, shape and sounding chord match.`,
  };
}
