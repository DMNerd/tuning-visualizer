import clsx from "clsx";

// "Shape → Sounds" readout for capo-relative chords.
export function CapoChordField({ display }) {
  return (
    <div className="tv-field" aria-label={display.ariaLabel}>
      <span className="tv-field__label">Capo chord</span>
      {display.hasActiveTransposition ? (
        <div className="tv-capo-chord-map">
          <span className="tv-capo-chord-map__part">
            <small>Shape</small>
            <strong>{display.shapeChordLabel}</strong>
          </span>
          <span className="tv-capo-chord-map__arrow" aria-hidden="true">
            →
          </span>
          <span className="tv-capo-chord-map__part">
            <small>Sounds</small>
            <strong>{display.soundingChordLabel}</strong>
          </span>
          <small className="tv-capo-chord-map__capo">
            capo {display.safeCapoFret}
          </small>
        </div>
      ) : (
        <small className="tv-field__help">{display.summaryText}</small>
      )}
    </div>
  );
}

function toneAriaLabel(tone, showChord) {
  if (!showChord) return `${tone.noteName}`;
  return `${tone.noteName}, ${
    tone.inScale
      ? `degree ${tone.degree ?? "unknown"} in selected scale`
      : "outside selected scale"
  }`;
}

// Chord tone chips with scale-degree/outside annotations and a summary line.
export function ChordToneField({
  chordTones,
  chordSummary,
  showChord,
  chordOverlayPcs,
}) {
  return (
    <div className="tv-field tv-field--scale-tones">
      <span className="tv-field__label">Chord tones</span>
      {chordTones.length > 0 ? (
        <div
          className="tv-tone-list tv-tone-list--analysis"
          role="list"
          aria-label="Chord tones"
        >
          {chordTones.map((tone) => (
            <div key={tone.pc} className="tv-tone-list__item" role="listitem">
              <span
                className={clsx("tv-tone-chip", {
                  "tv-tone-chip--in-scale": showChord && tone.inScale,
                  "tv-tone-chip--outside": showChord && !tone.inScale,
                  "tv-tone-chip--in-chord":
                    chordOverlayPcs instanceof Set &&
                    chordOverlayPcs.has(tone.pc),
                })}
                aria-label={toneAriaLabel(tone, showChord)}
              >
                <span>{tone.noteName}</span>
                {showChord ? (
                  <small className="tv-tone-chip__meta">
                    {tone.inScale ? `deg ${tone.degree ?? "–"}` : "outside"}
                  </small>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {chordSummary?.text ? (
        <small
          className={clsx("tv-field__help", {
            "tv-field__help--error": chordSummary.kind === "warning",
          })}
        >
          {chordSummary.text}
        </small>
      ) : null}
    </div>
  );
}
