import Section from "@/components/UI/Section";

export default function InlayControls({ mirrorInlays, onMirrorChange }) {
  return (
    <Section title="Inlays">
      <label className="check">
        <input
          type="checkbox"
          checked={mirrorInlays}
          onChange={(e) => onMirrorChange(e.target.checked)}
        />
        Mirror side inlays (both edges)
      </label>
    </Section>
  );
}
