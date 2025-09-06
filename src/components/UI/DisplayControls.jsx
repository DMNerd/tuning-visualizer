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
  // open-note scope
  openOnlyInScale,
  setOpenOnlyInScale,
  // accidentals
  accidental,
  setAccidental,
  // degree coloring
  colorByDegree,
  setColorByDegree,
}) {
  return (
    <Section title="Display">
      <div className="display-controls">
        {/* ───────── Notation (visually same as original) ───────── */}
        <div className="group" role="region" aria-label="Notation">
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
              <option value="fret">Fret number</option>
              <option value="off">Off</option>
            </select>
          </div>

          {/* Degree coloring toggle */}
          <label className="check" htmlFor="colorByDegree">
            <input
              id="colorByDegree"
              name="colorByDegree"
              type="checkbox"
              checked={colorByDegree}
              onChange={(e) => setColorByDegree(e.target.checked)}
            />{" "}
            Color notes by scale degree
          </label>
        </div>

        {/* ───────── Open strings (same visual as before) ───────── */}
        <div
          className="group"
          role="region"
          aria-label="Open strings"
          aria-disabled={!showOpen}
        >
          <div className="field">
            <span>Open notes</span>
            <div
              role="group"
              aria-label="Open note scope"
              className="radio-row"
            >
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
              <label className="check" htmlFor="open-all">
                <input
                  id="open-all"
                  name="open-scope"
                  type="radio"
                  checked={!openOnlyInScale}
                  onChange={() => setOpenOnlyInScale(false)}
                  disabled={!showOpen}
                />
                All strings
              </label>
              <label className="check" htmlFor="open-scale">
                <input
                  id="open-scale"
                  name="open-scope"
                  type="radio"
                  checked={openOnlyInScale}
                  onChange={() => setOpenOnlyInScale(true)}
                  disabled={!showOpen}
                />
                In current scale
              </label>
            </div>
          </div>
        </div>

        {/* ───────── Markers & sizing (same visual as before) ───────── */}
        <div className="group" role="region" aria-label="Markers and sizing">
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

          <div className="field">
            <span>Dot size</span>
            <input
              id="dotSize"
              name="dotSize"
              type="range"
              min="8"
              max="24"
              value={dotSize}
              onChange={(e) => setDotSize(parseInt(e.target.value, 10))}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
