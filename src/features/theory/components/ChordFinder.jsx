import { useId } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { FiX } from "react-icons/fi";
import ToggleSwitch from "@shared/ui/ToggleSwitch";
import {
  formatChordName,
  formatChordSymbol,
} from "@domain/theory/chordIdentify";
import { mod } from "@shared/lib/math";

const MAX_ALTERNATIVES = 5;

function MatchRow({ match, nameForPc, onShow, primary = false }) {
  const { t } = useTranslation();
  const symbol = formatChordSymbol(match, nameForPc);
  return (
    <li
      className={clsx("tv-chord-finder__match", {
        "tv-chord-finder__match--primary": primary,
      })}
    >
      <span className="tv-chord-finder__names">
        <strong className="tv-chord-finder__symbol">{symbol}</strong>
        <small>{formatChordName(match, nameForPc)}</small>
      </span>
      {match.appType ? (
        <button
          type="button"
          className="tv-button tv-button--ghost"
          onClick={() => onShow(match)}
          aria-label={t("theory.showMatchAria", { chord: symbol })}
          title={t("theory.showMatchTitle")}
        >
          {t("theory.showMatch")}
        </button>
      ) : null}
    </li>
  );
}

function ChordFinder({ state, actions, meta }) {
  const { t } = useTranslation();
  const { chordFinderActive = false, pickedPcs = [] } = state;
  const {
    setChordFinderActive,
    togglePickedPc,
    clearPickedPcs,
    onRootChange,
    onTypeChange,
    setShowChord,
  } = actions;
  const {
    nameForPc = (pc) => String(pc),
    divisions = 12,
    matches = [],
    chordRootOffset = 0,
  } = meta;
  const toggleId = useId();
  const headingId = useId();

  const [best, ...alternatives] = matches;

  const showMatch = (match) => {
    // Matches are named from sounding pitches; a capo-relative chord root is
    // the shape root, so undo the capo offset before loading it.
    onRootChange(nameForPc(mod(match.rootPc - chordRootOffset, divisions)));
    onTypeChange(match.appType);
    setShowChord(true);
    setChordFinderActive(false);
  };

  let status = null;
  if (chordFinderActive && pickedPcs.length === 0) {
    status = t("theory.finderStart");
  } else if (pickedPcs.length === 1) {
    status = t("theory.finderOneMore");
  } else if (pickedPcs.length > 1 && !best) {
    status = t("theory.finderNoMatch");
  }

  return (
    <div
      className={clsx("tv-controls", "tv-controls--chord-finder")}
      role="group"
      aria-labelledby={headingId}
    >
      <span id={headingId} className="tv-subsection__title">
        {t("theory.finderTitle")}
      </span>
      <div className="tv-field">
        <ToggleSwitch
          id={toggleId}
          name="chord-finder-active"
          checked={chordFinderActive}
          onChange={(e) => setChordFinderActive(e.target.checked)}
        >
          {t("theory.finderToggle")}
        </ToggleSwitch>
        <small className="tv-field__help">
          {chordFinderActive
            ? t("theory.finderHelpActive")
            : t("theory.finderHelpInactive")}
        </small>
      </div>

      {pickedPcs.length > 0 ? (
        <div className="tv-field">
          <span className="tv-field__label">{t("theory.pickedNotes")}</span>
          <div className="tv-chord-finder__picked">
            <ul
              className="tv-tone-list"
              aria-label={t("theory.pickedNotesAria")}
            >
              {pickedPcs.map((pc, index) => (
                <li key={pc} className="tv-tone-list__item">
                  <button
                    type="button"
                    className={clsx(
                      "tv-tone-chip",
                      "tv-tone-chip--button",
                      "tv-tone-chip--in-chord",
                    )}
                    onClick={() => togglePickedPc(pc)}
                    aria-label={t("theory.removeNote", { note: nameForPc(pc) })}
                    title={t("theory.remove")}
                  >
                    <span>{nameForPc(pc)}</span>
                  </button>
                  <small className="tv-tone-degree">
                    {[
                      best?.degrees[pc],
                      index === 0 && best && pc !== best.rootPc
                        ? t("theory.bass")
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="tv-button tv-button--icon tv-button--ghost"
              onClick={clearPickedPcs}
              aria-label={t("theory.clearPicked")}
              title={t("theory.clear")}
            >
              <FiX size={16} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      <div aria-live="polite">
        {best ? (
          <ul
            className="tv-chord-finder__matches"
            aria-label={t("theory.chordNames")}
          >
            <MatchRow
              match={best}
              nameForPc={nameForPc}
              onShow={showMatch}
              primary
            />
            {alternatives.slice(0, MAX_ALTERNATIVES).map((match) => (
              <MatchRow
                key={`${match.rootPc}-${match.id}`}
                match={match}
                nameForPc={nameForPc}
                onShow={showMatch}
              />
            ))}
          </ul>
        ) : status ? (
          <small className="tv-field__help">{status}</small>
        ) : null}
      </div>
    </div>
  );
}

export default ChordFinder;
