import { saveSvgAsPng, svgAsDataUri } from "save-svg-as-png";

export type ExportHeader = {
  system?: string;
  tuning?: string | string[];
  scale?: string;
  chordEnabled?: boolean;
  chordRoot?: string;
  chordType?: string;
};

type Box = { x: number; y: number; width: number; height: number };

const RE_SPACES = /\s+/g;
const RE_NON_ALNUM_DASH = /[^a-z0-9-]/gi;

export function slug(
  ...parts: Array<string | number | null | undefined>
): string {
  return parts
    .filter(Boolean)
    .map(String)
    .join("_")
    .replace(RE_SPACES, "-")
    .replace(RE_NON_ALNUM_DASH, "")
    .toLowerCase();
}

function getBox(svg: SVGSVGElement): Box {
  const vb = svg.viewBox?.baseVal;
  return vb
    ? { x: vb.x, y: vb.y, width: vb.width, height: vb.height }
    : // getBBox exists on SVGSVGElement via SVGGraphicsElement
      svg.getBBox();
}

function composeInfoLines(header?: ExportHeader | null): string[] {
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

  return [line1, line2].filter(Boolean) as string[];
}

function getBg(): string {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--bg")
      ?.trim() || "#ffffff"
  );
}

type ComposedSvg = {
  svg: SVGSVGElement;
  box: Box;
  addedTop: number;
};

/**
 * Create a new SVG that draws the info header above the original svgNode.
 * Returns { svg, box, addedTop } where svg is the composed SVG element.
 */
function createSvgWithHeader(
  svgNode: SVGSVGElement,
  header?: ExportHeader | null,
  pad: number = 16,
): ComposedSvg {
  const lines = composeInfoLines(header);
  if (!lines.length) {
    return { svg: svgNode, box: getBox(svgNode), addedTop: 0 };
  }

  const NS = "http://www.w3.org/2000/svg";
  const origBox = getBox(svgNode);
  const lineHeight = 18;
  const topPadding = 12;
  const headerHeight = lines.length * lineHeight + topPadding;

  // Container SVG sized by original viewBox/bbox + header
  const composed = document.createElementNS(NS, "svg") as SVGSVGElement;
  composed.setAttribute("xmlns", NS);
  const width = Math.ceil(origBox.width + pad * 2);
  const height = Math.ceil(origBox.height + pad * 2 + headerHeight);

  composed.setAttribute("viewBox", `0 0 ${width} ${height}`);
  composed.setAttribute("width", String(width));
  composed.setAttribute("height", String(height));

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

  const box: Box = { x: 0, y: 0, width, height };
  return { svg: composed, box, addedTop: headerHeight };
}

export async function downloadPNG(
  svgNode: SVGSVGElement | null,
  filename: string = "fretboard.png",
  scale: number = 3,
  pad: number = 16,
  header?: ExportHeader | null,
): Promise<void> {
  if (!svgNode) return;
  const { svg: composed, box } = createSvgWithHeader(svgNode, header, pad);

  await saveSvgAsPng(composed, filename, {
    scale,
    left: box.x,
    top: box.y,
    width: Math.ceil(box.width),
    height: Math.ceil(box.height),
    backgroundColor: getBg(),
  } as any);
}

export async function downloadSVG(
  svgNode: SVGSVGElement | null,
  filename: string = "fretboard.svg",
  header?: ExportHeader | null,
  pad: number = 16,
): Promise<void> {
  if (!svgNode) return;

  const { svg: composed } = createSvgWithHeader(svgNode, header, pad);
  const dataUri = await svgAsDataUri(composed, {
    backgroundColor: getBg(),
  } as any);

  const a = document.createElement("a");
  a.href = dataUri;
  a.download = filename;
  a.click();
}

export async function printFretboard(
  svgNode: SVGSVGElement | null,
  header?: ExportHeader | null,
  pad = 16,
): Promise<void> {
  if (!svgNode) return;

  const { svg: composed } = createSvgWithHeader(svgNode, header, pad);
  const dataUri = await svgAsDataUri(composed, {
    backgroundColor: "#ffffff",
  } as any);

  const html = `<!doctype html>
  <html>
  <head>
  <meta charset="utf-8" />
  <title>&#8203;</title>
  <style>
    @page { size: auto; margin: 0; }
    html,body { margin:0; padding:0; background:#ffffff; }
    img { display:block; max-width:100%; height:auto; margin:0 auto; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style>
  </head>
  <body>
    <img id="fb" src="${dataUri}" alt="Fretboard"/>
  </body>
  </html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  (iframe as HTMLIFrameElement & { srcdoc?: string }).srcdoc = html;
  document.body.appendChild(iframe);

  const cleanup = () => setTimeout(() => iframe.remove(), 300);

  iframe.onload = () => {
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) {
      cleanup();
      return;
    }

    const img = doc.getElementById("fb") as HTMLImageElement | null;

    const doPrint = () => {
      try {
        win.focus();
        win.print();
      } finally {
        cleanup();
      }
    };

    if (img && !img.complete) {
      img.onload = () => doPrint();
      img.onerror = () => cleanup();
    } else {
      doPrint();
    }
  };
}
