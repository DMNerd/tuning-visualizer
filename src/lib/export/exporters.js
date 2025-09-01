import { saveAs } from "file-saver";
import { saveSvgAsPng, svgAsDataUri } from "save-svg-as-png";

export function slug(...parts) {
  return parts
    .filter(Boolean)
    .join("_")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/gi, "")
    .toLowerCase();
}

// ✅ Export raw SVG to PNG
export async function downloadPNG(svgNode, filename = "fretboard.png", scale = 3) {
  if (!svgNode) return;
  await saveSvgAsPng(svgNode, filename, {
    scale,
    backgroundColor:
      getComputedStyle(document.documentElement).getPropertyValue("--bg")?.trim() || "#ffffff",
  });
}

// ✅ Export raw SVG (styled) to .svg file
export async function downloadSVG(svgNode, filename = "fretboard.svg") {
  if (!svgNode) return;

  const dataUri = await svgAsDataUri(svgNode, {
    backgroundColor:
      getComputedStyle(document.documentElement).getPropertyValue("--bg")?.trim() || "#ffffff",
  });

  const blob = await (await fetch(dataUri)).blob();
  saveAs(blob, filename);
}

// ✅ Print (still works with outerHTML)
export function printFretboard(svgNode) {
  if (!svgNode) return;
  const win = window.open("", "_blank", "noopener,noreferrer");
  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Fretboard Print</title>
  <style>
    @page { size: A4; margin: 12mm; }
    html, body { height: 100%; }
    body { margin: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .wrap { display: flex; align-items: center; justify-content: center; padding: 12mm; }
  </style>
</head>
<body>
  <div class="wrap">${svgNode.outerHTML}</div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
  win.document.write(html);
  win.document.close();
}
