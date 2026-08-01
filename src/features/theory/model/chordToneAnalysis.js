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

export function buildChordSummary({ showChord, chordTones, scaleSet }) {
  if (!showChord) return null;
  if (!chordTones.length) return null;
  if (scaleSet.size === 0) {
    return {
      kind: "info",
      text: "Select a scale to analyse the chord.",
    };
  }

  const outside = chordTones.filter((tone) => !tone.inScale);
  if (outside.length > 0) {
    return {
      kind: "warning",
      text: `Outside selected scale: ${outside.map((tone) => tone.noteName).join(", ")}`,
    };
  }

  const degreeLabels = chordTones
    .map((tone) => (tone.degree != null ? String(tone.degree) : "–"))
    .join(", ");

  return {
    kind: "success",
    text: `All chord tones are in scale (degrees: ${degreeLabels}).`,
  };
}
