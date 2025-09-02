// exporters.js
import { saveSvgAsPng, svgAsDataUri } from "save-svg-as-png";

export function slug(...parts) {
  return parts
    .filter(Boolean)
    .join("_")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/gi, "")
    .toLowerCase();
}

function getBox(svg) {
  const vb = svg.viewBox && svg.viewBox.baseVal;
  return vb
    ? { x: vb.x, y: vb.y, width: vb.width, height: vb.height }
    : svg.getBBox();
}

function composeInfoLines(header) {
  if (!header) return [];
  const { system, tuning, scale, chordEnabled, chordRoot, chordType } = header;

  const line1 = [
    system ? `System: ${system}` : null,
    tuning
      ? `Tuning: ${Array.isArray(tuning) ? tuning.join(" ") : tuning}`
      : null,
    scale ? `Scale: ${scale}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const line2 =
    chordEnabled && chordRoot && chordType
      ? `Chord overlay: ${chordRoot} ${chordType}`
      : null;

  return [line1, line2].filter(Boolean);
}

function getBg() {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--bg")
      ?.trim() || "#ffffff"
  );
}

/**
 * Create a new SVG that draws the info header above the original svgNode.
 * Returns { svg, box } where svg is the composed SVG element.
 */
function createSvgWithHeader(svgNode, header, pad = 16) {
  const lines = composeInfoLines(header);
  if (!lines.length) return { svg: svgNode, box: getBox(svgNode), addedTop: 0 };

  const NS = "http://www.w3.org/2000/svg";
  const origBox = getBox(svgNode);
  const lineHeight = 18; 
  const topPadding = 12;
  const headerHeight = lines.length * lineHeight + topPadding;

  // Container SVG sized by original viewBox/bbox + header
  const composed = document.createElementNS(NS, "svg");
  composed.setAttribute("xmlns", NS);
  const width = Math.ceil(origBox.width + pad * 2);
  const height = Math.ceil(origBox.height + pad * 2 + headerHeight);

  composed.setAttribute("viewBox", `0 0 ${width} ${height}`);
  composed.setAttribute("width", width);
  composed.setAttribute("height", height);

  // Background
  const bgRect = document.createElementNS(NS, "rect");
  bgRect.setAttribute("x", "0");
  bgRect.setAttribute("y", "0");
  bgRect.setAttribute("width", String(width));
  bgRect.setAttribute("height", String(height));
  bgRect.setAttribute("fill", getBg());
  composed.appendChild(bgRect);

  // Header group
  const gHeader = document.createElementNS(NS, "g");
  gHeader.setAttribute("transform", `translate(0, ${pad})`);
  const textColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--fg")
      ?.trim() || "#111";
  const fontFamily =
    getComputedStyle(document.body).getPropertyValue("font-family") ||
    "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

  lines.forEach((ln, i) => {
    const t = document.createElementNS(NS, "text");
    t.textContent = ln;
    // center horizontally
    t.setAttribute("x", String(width / 2));
    t.setAttribute("y", String((i + 1) * lineHeight - 4));
    t.setAttribute("font-size", "14"); 
    t.setAttribute("font-weight", "600");
    t.setAttribute("font-family", fontFamily);
    t.setAttribute("fill", textColor);
    t.setAttribute("text-anchor", "middle"); 
    gHeader.appendChild(t);
  });
  composed.appendChild(gHeader);

  // Copy ONLY children of original into a group (avoid nested <svg>)
  const gWrap = document.createElementNS(NS, "g");
  const shiftX = pad - origBox.x;
  const shiftY = pad + headerHeight - origBox.y;
  gWrap.setAttribute("transform", `translate(${shiftX}, ${shiftY})`);
  Array.from(svgNode.childNodes).forEach((n) => {
    gWrap.appendChild(n.cloneNode(true));
  });
  composed.appendChild(gWrap);

  const box = { x: 0, y: 0, width, height };
  return { svg: composed, box, addedTop: headerHeight };
}

export async function downloadPNG(
  svgNode,
  filename = "fretboard.png",
  scale = 3,
  pad = 16,
  header = null,
) {
  if (!svgNode) return;
  const { svg: composed, box } = createSvgWithHeader(svgNode, header, pad);

  await saveSvgAsPng(composed, filename, {
    scale,
    left: box.x,
    top: box.y,
    width: Math.ceil(box.width),
    height: Math.ceil(box.height),
    backgroundColor: getBg(),
  });
}

export async function downloadSVG(
  svgNode,
  filename = "fretboard.svg",
  header = null,
  pad = 16,
) {
  if (!svgNode) return;

  const { svg: composed } = createSvgWithHeader(svgNode, header, pad);
  const dataUri = await svgAsDataUri(composed, {
    backgroundColor: getBg(),
  });

  const a = document.createElement("a");
  a.href = dataUri;
  a.download = filename;
  a.click();
}

export async function printFretboard(svgNode, header = null, pad = 16) {
  if (!svgNode) return;

  const { svg: composed } = createSvgWithHeader(svgNode, header, pad);
  const dataUri = await svgAsDataUri(composed, {
    backgroundColor: getBg(),
  });

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Print Fretboard</title>
<style>
  html,body{margin:0;padding:0;background:${getBg()};}
  img{display:block;max-width:100%;height:auto;margin:0 auto;}
  @page { size: auto; margin: 12mm; }
</style>
</head>
<body>
  <img src="${dataUri}" alt="Fretboard export"/>
  <script>window.onload = () => setTimeout(() => window.print(), 50);</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
