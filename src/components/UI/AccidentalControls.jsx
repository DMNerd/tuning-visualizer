import Section from "@/components/UI/Section";

export default function AccidentalControls({ value, onChange }) {
  return (
    <Section title="Accidentals">
      <div className="grid2">
        <label className="check">
          <input
            type="radio"
            name="accidentals"
            value="sharp"
            checked={value === "sharp"}
            onChange={() => onChange("sharp")}
          />
          Use sharps (♯)
        </label>
        <label className="check">
          <input
            type="radio"
            name="accidentals"
            value="flat"
            checked={value === "flat"}
            onChange={() => onChange("flat")}
          />
          Use flats (♭)
        </label>
      </div>
    </Section>
  );
}
