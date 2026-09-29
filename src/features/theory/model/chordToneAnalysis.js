import i18n from "@shared/i18n";

export function buildChordTones({
  chordTonePcs,
  chordRootPc,
  rootIx,
  divisions,
  nameForPc,
  degreeForPc,
  scaleSet,
}) {
  if (!chordTonePcs || chordTonePcs.size === 0) return [];
  if (!divisions) return [];

  const anchorRaw = Number.isFinite(chordRootPc)
    ? chordRootPc
    : Number.isFinite(rootIx)
      ? rootIx
      : 0;
  const anchor = ((anchorRaw % divisions) + divisions) % divisions;

  const pcs = Array.from(chordTonePcs, (value) => {
    const wrapped = ((value % divisions) + divisions) % divisions;
    return wrapped;
  });

  pcs.sort((a, b) => {
    const da = (a - anchor + divisions) % divisions;
    const db = (b - anchor + divisions) % divisions;
    return da - db;
  });

  return pcs.map((pc) => {
    const noteName = nameForPc?.(pc) ?? String(pc);
    const degree = degreeForPc(pc);
    const inScale = scaleSet.has(pc);
    return { pc, noteName, degree, inScale };
  });
}

export function buildChordSummary({
  showChord,
  chordTones,
  scaleSet,
  t = i18n.t,
}) {
  if (!showChord) return null;
  if (!chordTones.length) return null;
  // Per-tone degrees/"outside" are on the chips and the in-scale count is in
  // the chord-fit badge, so only the no-scale case needs a line of its own.
  if (scaleSet.size > 0) return null;
  return {
    kind: "info",
    text: t("theory.summarySelectScale"),
  };
}
