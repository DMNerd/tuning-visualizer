export function buildChordFit(scaleTonePcs = [], chordTonePcs = null) {
  const chordPcs = chordTonePcs instanceof Set ? [...chordTonePcs] : [];
  const total = chordPcs.length;
  if (total === 0) {
    return {
      inScale: 0,
      total: 0,
      outside: 0,
      text: null,
      kind: "success",
    };
  }

  const scaleToneSet = new Set(scaleTonePcs);
  const inScale = chordPcs.filter((pc) => scaleToneSet.has(pc)).length;
  const outside = Math.max(total - inScale, 0);

  return {
    inScale,
    total,
    outside,
    text: `Chord fit: ${inScale}/${total} tones in scale`,
    kind: outside > 0 ? "warning" : "success",
  };
}
