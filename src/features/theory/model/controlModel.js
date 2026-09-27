import {
  getEffectiveCapoPitchOffset,
  transposeCapoRelativeChordRootPc,
  transposePitchClassSet,
} from "@domain/theory/capoChords";

export function buildTheoryControlModel({
  system,
  scale,
  chord,
  randomize,
  defaults,
  capo,
}) {
  const divisions =
    Number(system?.system?.divisions) || system?.sysNames?.length || 12;
  const scaleIntervals = Array.isArray(scale?.intervals) ? scale.intervals : [];
  const safeRootIx = Number.isFinite(system?.rootIx) ? system.rootIx : 0;

  const scaleTonePcs = scaleIntervals.map(
    (interval) =>
      (((safeRootIx + interval) % divisions) + divisions) % divisions,
  );
  const scaleToneLabels = scaleTonePcs.map((pc) =>
    typeof system?.nameForPc === "function" ? system.nameForPc(pc) : String(pc),
  );

  const capoFret = Number.isFinite(capo?.capoFret) ? capo.capoFret : 0;
  const chordCapoRelative = Boolean(chord?.chordCapoRelative);
  const effectiveCapoPitchOffset = getEffectiveCapoPitchOffset(
    capoFret,
    divisions,
  );
  const transposeBy = chordCapoRelative ? effectiveCapoPitchOffset : 0;
  const transposedChordRootPc = Number.isFinite(chord?.chordRootIx)
    ? transposeCapoRelativeChordRootPc({
        pc: chord.chordRootIx,
        capoFret,
        chordCapoRelative,
        divisions,
      })
    : chord?.chordRootIx;
  const transposedChordRoot =
    chordCapoRelative && typeof system?.nameForPc === "function"
      ? system.nameForPc(transposedChordRootPc)
      : chord?.chordRoot;
  const chordTonePcs = transposePitchClassSet(
    chord?.chordTonePcs,
    transposeBy,
    divisions,
  );
  const chordOverlayPcs = transposePitchClassSet(
    chord?.chordOverlayPcs,
    transposeBy,
    divisions,
  );

  // "Independent of scale" (chord-tones-only mode): the fretboard treats the
  // chord itself as the scale, so the chord root takes the root color and
  // degree/interval labels, and no tone is marked as outside the scale.
  const chordAsScale =
    Boolean(chord?.showChord) &&
    Boolean(chord?.hideNonChord) &&
    Boolean(chord?.chordIgnoresScale) &&
    Number.isFinite(transposedChordRootPc) &&
    chordTonePcs?.size > 0;
  const fretboardRootIx = chordAsScale ? transposedChordRootPc : safeRootIx;
  const fretboardIntervals = chordAsScale
    ? [...chordTonePcs]
        .map((pc) => (pc - transposedChordRootPc + divisions) % divisions)
        .sort((a, b) => a - b)
    : scaleIntervals;

  return {
    state: {
      root: scale?.root,
      scale: scale?.scale,
      intervals: scaleIntervals,
      randomizeMode: randomize?.randomizeMode,
      chordRoot: chord?.chordRoot,
      chordType: chord?.chordType,
      showChord: chord?.showChord,
      hideNonChord: chord?.hideNonChord,
      chordCapoRelative,
      chordIgnoresScale: Boolean(chord?.chordIgnoresScale),
      defaultRoot: defaults?.root,
      defaultScale: defaults?.scale,
      defaultChordRoot: defaults?.chordRoot,
      defaultChordType: defaults?.chordType,
    },
    actions: {
      setRoot: scale?.setRoot,
      setScale: scale?.setScale,
      setRandomizeMode: randomize?.setRandomizeMode,
      onRandomize: randomize?.onRandomize,
      onRootChange: chord?.setChordRoot,
      onTypeChange: chord?.setChordType,
      setShowChord: chord?.setShowChord,
      setHideNonChord: chord?.setHideNonChord,
      setChordCapoRelative: chord?.setChordCapoRelative,
      setChordIgnoresScale: chord?.setChordIgnoresScale,
    },
    meta: {
      sysNames: system?.sysNames ?? [],
      scaleOptions: scale?.scaleOptions ?? [],
      scaleTonePcs,
      scaleToneLabels,
      chordTonePcs,
      chordOverlayPcs,
      supportsMicrotonal: Number(system?.system?.divisions) > 12,
      system: system?.system,
      rootIx: safeRootIx,
      fretboardRootIx,
      fretboardIntervals,
      nameForPc: system?.nameForPc,
      chordRootPc: transposedChordRootPc,
      capoFret,
      originalChordRoot: chord?.chordRoot,
      transposedChordRoot,
      isChordTransposed: chordCapoRelative && effectiveCapoPitchOffset !== 0,
    },
  };
}
