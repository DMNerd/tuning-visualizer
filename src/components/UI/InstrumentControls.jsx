import Section from "@/components/UI/Section";

function clamp(n, min, max) {
  const v = Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, v));
}

export default function InstrumentControls({
  strings,
  frets,
  setFrets, // pass setFretsUI from App to mark 'touched'
  sysNames,
  tuning,
  setTuning,
  handleStringsChange,
  presetNames,
  selectedPreset,
  setSelectedPreset,
  savedExists,
  handleSaveDefault,
  handleLoadSavedDefault,
  handleResetFactoryDefault,
  systemId,
}) {
  return (
    <Section title="Instrument">
      <div className="instrument">
        <div className="row-2">
          <div className="field">
            <span>Strings</span>
            <input
              id="strings"
              name="strings"
              type="number"
              min="4"
              max="8"
              value={strings}
              onChange={(e) => {
                const val = clamp(parseInt(e.target.value, 10), 4, 8);
                handleStringsChange(val);
              }}
            />
          </div>

          <div className="field">
            <span>Frets</span>
            <input
              id="frets"
              name="frets"
              type="number"
              min="12"
              max="30"
              value={frets}
              onChange={(e) => {
                const val = clamp(parseInt(e.target.value, 10), 12, 30);
                setFrets(val); // this is setFretsUI from App, marks fretsTouched
              }}
            />
          </div>
        </div>

        <div className="strings-grid">
          {tuning.map((note, i) => {
            const stringNum = strings - i;
            return (
              <div key={i} className="field">
                <span>String {stringNum}</span>
                <select
                  id={`string-${stringNum}`}
                  name={`string-${stringNum}`}
                  value={note}
                  onChange={(e) => {
                    const copy = [...tuning];
                    copy[i] = e.target.value;
                    setTuning(copy);
                  }}
                >
                  {sysNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="field" style={{ marginTop: 8 }}>
          <span>Preset</span>
          <select
            id="preset"
            name="preset"
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
          >
            {presetNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div
          className="defaults-row"
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          <button className="btn" onClick={handleSaveDefault}>
            Save as default ({systemId}, {strings}-string)
          </button>
          <button
            className="btn"
            onClick={handleLoadSavedDefault}
            disabled={!savedExists}
            title={savedExists ? "" : "No saved default for this system/count"}
          >
            Load saved
          </button>
          <button className="btn" onClick={handleResetFactoryDefault}>
            Reset to factory default
          </button>
        </div>
      </div>
    </Section>
  );
}
