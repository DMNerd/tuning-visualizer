import Section from "@/components/UI/Section";

export default function ExportControls({
  boardRef,
  fileBase,
  downloadPNG,
  downloadSVG,
  printFretboard,
}) {
  return (
    <Section title="Export">
      <button
        className="btn"
        onClick={() =>
          boardRef.current && downloadPNG(boardRef.current, `${fileBase}.png`)
        }
      >
        Export PNG
      </button>
      <button
        className="btn"
        onClick={() =>
          boardRef.current && downloadSVG(boardRef.current, `${fileBase}.svg`)
        }
      >
        Export SVG
      </button>
      <button
        className="btn"
        onClick={() => boardRef.current && printFretboard(boardRef.current)}
      >
        Print
      </button>
    </Section>
  );
}
