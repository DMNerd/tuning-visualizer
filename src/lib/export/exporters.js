import { saveSvgAsPng, svgAsDataUri } from "save-svg-as-png";

export function slug(...parts) {
  return parts
    .filter(Boolean)
    .join("_")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/gi, "") // fix: '-' doesn't need escaping
    .toLowerCase();
}

function getBox(svg) {
  const vb = svg.viewBox && svg.viewBox.baseVal;
  return vb
    ? { x: vb.x, y: vb.y, width: vb.width, height: vb.height }
    : svg.getBBox();
}

export async function downloadPNG(svgNode, filename = "fretboard.png", scale = 3, pad = 16) {
  if (!svgNode) return;
  const box = getBox(svgNode);

  await saveSvgAsPng(svgNode, filename, {
    scale,
    left: box.x - pad,
    top: box.y - pad,
    width: Math.ceil(box.width + pad * 2),
    height: Math.ceil(box.height + pad * 2),
    backgroundColor:
      getComputedStyle(document.documentElement).getPropertyValue("--bg")?.trim() || "#ffffff",
  });
}

export async function downloadSVG(svgNode, filename = "fretboard.svg") {
  if (!svgNode) return;
  const dataUri = await svgAsDataUri(svgNode, {
    backgroundColor:
      getComputedStyle(document.documentElement).getPropertyValue("--bg")?.trim() || "#ffffff",
  });
  const a = document.createElement("a");
  a.href = dataUri;
  a.download = filename;
  a.click();
}

export async function printFretboard(svgNode) {
  if (!svgNode) return;
  const dataUri = await svgAsDataUri(svgNode, {
    backgroundColor:
      getComputedStyle(document.documentElement).getPropertyValue("--bg")?.trim() || "#ffffff",
  });

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Print Fretboard</title>
<style>
  html,body{margin:0;padding:0;}
  img{display:block;max-width:100%;height:auto;margin:0 auto;}
  @page { size: auto; margin: 12mm; }
</style>
</head>
<body>
  <img src="${dataUri}" />
  <script>window.onload = () => setTimeout(() => window.print(), 50);</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
