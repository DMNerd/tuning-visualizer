import Section from "@/components/UI/Section";

export default function DisplayControls({
  // labels & visibility
  show,
  setShow,
  showOpen,
  setShowOpen,
  showFretNums,
  setShowFretNums,
  dotSize,
  setDotSize,
  // accidentals
  accidental,
  setAccidental,
}) {
  return (
    <Section title="Display">
      {/* Accidentals */}
      <div className="field">
        <span>Accidentals</span>
        <div role="group" aria-label="Accidentals" className="radio-row">
          <label className="check" htmlFor="acc-sharp">
            <input
              id="acc-sharp"
              name="accidental"
              type="radio"
              value="sharp"
              checked={accidental === "sharp"}
              onChange={() => setAccidental("sharp")}
            />
            Sharps (C, C#, D…)
          </label>
          <label className="check" htmlFor="acc-flat">
            <input
              id="acc-flat"
              name="accidental"
              type="radio"
              value="flat"
              checked={accidental === "flat"}
              onChange={() => setAccidental("flat")}
            />
            Flats (C, Db, D…)
          </label>
        </div>
      </div>

      {/* Labels */}
      <div className="field">
        <span>Labels</span>
        <select
          id="labels"
          name="labels"
          value={show}
          onChange={(e) => setShow(e.target.value)}
        >
          <option value="names">Note names</option>
          <option value="degrees">Degrees</option>
          <option value="off">Off</option>
        </select>
      </div>

      {/* Visibility toggles */}
      <label className="check" htmlFor="showOpen">
        <input
          id="showOpen"
          name="showOpen"
          type="checkbox"
          checked={showOpen}
          onChange={(e) => setShowOpen(e.target.checked)}
        />{" "}
        Show open notes
      </label>

      <label className="check" htmlFor="showFretNums">
        <input
          id="showFretNums"
          name="showFretNums"
          type="checkbox"
          checked={showFretNums}
          onChange={(e) => setShowFretNums(e.target.checked)}
        />{" "}
        Show fret numbers
      </label>

      {/* Dot size */}
      <div className="field">
        <span>Dot size</span>
        <input
          id="dotSize"
          name="dotSize"
          type="range"
          min="8"
          max="24"
          value={dotSize}
          onChange={(e) => setDotSize(parseInt(e.target.value))}
        />
      </div>
    </Section>
  );
}
