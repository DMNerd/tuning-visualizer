import { useId } from "react";
import clsx from "clsx";
import { FiX } from "react-icons/fi";
import ToggleSwitch from "@shared/ui/ToggleSwitch";
import {
  formatChordName,
  formatChordSymbol,
} from "@domain/theory/chordIdentify";
import { mod } from "@shared/lib/math";

const MAX_ALTERNATIVES = 5;

function MatchRow({ match, nameForPc, onShow, primary = false }) {
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
          aria-label={`Show ${symbol} on the fretboard`}
          title="Load into the chord controls and show the overlay"
        >
          Show
        </button>
      ) : null}
    </li>
  );
}

function ChordFinder({ state, actions, meta }) {
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
    status = "Click notes on the fretboard to add them.";
  } else if (pickedPcs.length === 1) {
    status = "Pick at least one more note.";
  } else if (pickedPcs.length > 1 && !best) {
    status = "No chord name found for these notes.";
  }

  return (
    <div
      className={clsx("tv-controls", "tv-controls--chord-finder")}
      role="group"
      aria-labelledby={headingId}
    >
      <span id={headingId} className="tv-subsection__title">
        What's this chord?
      </span>
      <div className="tv-field">
        <ToggleSwitch
          id={toggleId}
          name="chord-finder-active"
          checked={chordFinderActive}
          onChange={(e) => setChordFinderActive(e.target.checked)}
        >
          Pick notes on the fretboard
        </ToggleSwitch>
        <small className="tv-field__help">
          {chordFinderActive
            ? "Click a note to add or remove it; the first pick is the bass."
            : "Turn on, then click notes to name the chord they make."}
        </small>
      </div>

      {pickedPcs.length > 0 ? (
        <div className="tv-field">
          <span className="tv-field__label">Picked notes</span>
          <div className="tv-chord-finder__picked">
            <ul
              className="tv-tone-list"
              aria-label="Picked notes, click to remove"
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
                    aria-label={`Remove ${nameForPc(pc)}`}
                    title="Remove"
                  >
                    <span>{nameForPc(pc)}</span>
                  </button>
                  <small className="tv-tone-degree">
                    {[
                      best?.degrees[pc],
                      index === 0 && best && pc !== best.rootPc ? "bass" : "",
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
              aria-label="Clear picked notes"
              title="Clear"
            >
              <FiX size={16} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      <div aria-live="polite">
        {best ? (
          <ul className="tv-chord-finder__matches" aria-label="Chord names">
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
