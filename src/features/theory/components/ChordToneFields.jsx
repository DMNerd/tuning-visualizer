import clsx from "clsx";
import { useTranslation } from "react-i18next";

// "Shape → Sounds" readout for capo-relative chords.
export function CapoChordField({ display }) {
  const { t } = useTranslation();
  return (
    <div className="tv-field" aria-label={display.ariaLabel}>
      <span className="tv-field__label">{t("theory.capoChord")}</span>
      {display.hasActiveTransposition ? (
        <div className="tv-capo-chord-map">
          <span className="tv-capo-chord-map__part">
            <small>{t("theory.capoShape")}</small>
            <strong>{display.shapeChordLabel}</strong>
          </span>
          <span className="tv-capo-chord-map__arrow" aria-hidden="true">
            →
          </span>
          <span className="tv-capo-chord-map__part">
            <small>{t("theory.capoSounds")}</small>
            <strong>{display.soundingChordLabel}</strong>
          </span>
          <small className="tv-capo-chord-map__capo">
            {t("theory.capoFret", { fret: display.safeCapoFret })}
          </small>
        </div>
      ) : (
        <small className="tv-field__help">{display.summaryText}</small>
      )}
    </div>
  );
}

function toneAriaLabel(t, tone, showChord) {
  if (!showChord) return `${tone.noteName}`;
  return tone.inScale
    ? t("theory.toneDegreeAria", {
        note: tone.noteName,
        degree: tone.degree ?? t("theory.unknownDegree"),
      })
    : t("theory.toneOutsideAria", { note: tone.noteName });
}

// Chord tone chips with scale-degree/outside annotations (plus a hint when no
// scale is selected).
export function ChordToneField({
  chordTones,
  chordSummary,
  showChord,
  chordOverlayPcs,
}) {
  const { t } = useTranslation();
  return (
    <div className="tv-field tv-field--scale-tones">
      <span className="tv-field__label">{t("theory.chordTones")}</span>
      {chordTones.length > 0 ? (
        <div
          className="tv-tone-list tv-tone-list--analysis"
          role="list"
          aria-label={t("theory.chordTones")}
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
                aria-label={toneAriaLabel(t, tone, showChord)}
              >
                <span>{tone.noteName}</span>
                {showChord ? (
                  <small className="tv-tone-chip__meta">
                    {tone.inScale
                      ? t("theory.toneDegree", { degree: tone.degree ?? "–" })
                      : t("theory.toneOutside")}
                  </small>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {chordSummary?.text ? (
        <small className="tv-field__help">{chordSummary.text}</small>
      ) : null}
    </div>
  );
}
