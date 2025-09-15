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
  if (vb) return { x: vb.x, y: vb.y, width: vb.width, height: vb.height };
  const b = (svg as unknown as SVGGraphicsElement).getBBox();
  return { x: b.x, y: b.y, width: b.width, height: b.height };
}

function cloneSvg(
  svg: SVGSVGElement,
  opts?: { forceTheme?: "light" | "dark" },
): SVGSVGElement {
  const clone = svg.cloneNode(true) as SVGSVGElement;

  const { width, height } = getBox(svg);
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));

  const html = document.documentElement;
  const prevTheme = html.getAttribute("data-theme");
  const mustToggle = opts?.forceTheme && prevTheme !== opts.forceTheme;

  try {
    if (mustToggle) html.setAttribute("data-theme", opts!.forceTheme!);
    inlineComputedStyles(svg, clone);
  } finally {
    if (mustToggle) {
      if (prevTheme) html.setAttribute("data-theme", prevTheme);
      else html.removeAttribute("data-theme");
    }
  }

  return clone;
}

function inlineComputedStyles(src: Element, dest: Element) {
  const maybeWin = src.ownerDocument?.defaultView as
    | (Window & typeof globalThis)
    | null;
  if (!maybeWin) return;
  const W = maybeWin;

  const walker = document.createTreeWalker(src, NodeFilter.SHOW_ELEMENT);
  const destWalker = document.createTreeWalker(dest, NodeFilter.SHOW_ELEMENT);

  applyStyle(src as HTMLElement, dest as HTMLElement, W);

  while (true) {
    const s = walker.nextNode() as HTMLElement | null;
    const d = destWalker.nextNode() as HTMLElement | null;
    if (!s || !d) break;
    applyStyle(s, d, W);
  }

  function applyStyle(
    from: HTMLElement,
    to: HTMLElement,
    win: Window & typeof globalThis,
  ) {
    const cs = win.getComputedStyle(from);
    const props = [
      // general text/paint
      "opacity",
      "font",
      "font-family",
      "font-size",
      "font-weight",
      "color",
      "fill",

      // strokes (include dash props so micro-frets look right)
      "stroke",
      "stroke-width",
      "stroke-linejoin",
      "stroke-linecap",
      "stroke-miterlimit",
      "stroke-opacity",
      "stroke-dasharray",
      "stroke-dashoffset",

      // rendering hints
      "paint-order",
      "text-rendering",
      "shape-rendering",
    ] as const;

    const style: Record<string, string> = {};
    for (const p of props) {
      const v = cs.getPropertyValue(p);
      if (v) style[p] = v;
    }

    const styleStr = Object.entries(style)
      .map(([k, v]) => `${k}:${v}`)
      .join(";");

    if (styleStr) {
      const prev = to.getAttribute("style");
      to.setAttribute("style", `${prev ? prev + ";" : ""}${styleStr}`);
    }
  }
}

function withPaddingAndHeader(
  svg: SVGSVGElement,
  padding = 16,
  header: ExportHeader | null = null,
): SVGSVGElement {
  const source = cloneSvg(svg, { forceTheme: "light" });

  const { width, height, x, y } = getBox(source);

  const HEADER_TEXT = header ? formatHeaderSingleLine(header) : null;
  const HEADER_FONT_SIZE = 32;
  const HEADER_GAP = HEADER_TEXT ? 12 : 0;

  const CARD_RADIUS = 22;
  const CARD_BORDER = "#e6e6e6";

  const INNER = padding;
  const OUTER = 24;

  const cardW = width + INNER * 2;
  const cardH = height + INNER * 2;

  const totalW = cardW + OUTER * 2;
  const headerBlock = HEADER_TEXT ? HEADER_FONT_SIZE + HEADER_GAP : 0;
  const totalH = headerBlock + cardH + OUTER * 2;

  const outer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  outer.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  outer.setAttribute("width", String(totalW));
  outer.setAttribute("height", String(totalH));
  outer.setAttribute("viewBox", `0 0 ${totalW} ${totalH}`);

  const bg = document.createElementNS(outer.namespaceURI, "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", String(totalW));
  bg.setAttribute("height", String(totalH));
  bg.setAttribute("fill", "#0b0b0b");
  outer.appendChild(bg);

  if (HEADER_TEXT) {
    const t = document.createElementNS(outer.namespaceURI, "text");
    t.textContent = HEADER_TEXT;
    t.setAttribute("x", String(totalW / 2));
    t.setAttribute("y", String(OUTER + HEADER_FONT_SIZE));
    t.setAttribute("text-anchor", "middle");
    t.setAttribute(
      "font-family",
      "system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif",
    );
    t.setAttribute("font-size", String(HEADER_FONT_SIZE));
    t.setAttribute("font-weight", "800");
    t.setAttribute("fill", "#ffffff");
    outer.appendChild(t);
  }

  const cardX = OUTER;
  const cardY = OUTER + headerBlock;

  const card = document.createElementNS(outer.namespaceURI, "rect");
  card.setAttribute("x", String(cardX));
  card.setAttribute("y", String(cardY));
  card.setAttribute("width", String(cardW));
  card.setAttribute("height", String(cardH));
  card.setAttribute("rx", String(CARD_RADIUS));
  card.setAttribute("ry", String(CARD_RADIUS));
  card.setAttribute("fill", "#ffffff");
  card.setAttribute("stroke", CARD_BORDER);
  card.setAttribute("stroke-width", "1");
  outer.appendChild(card);

  const g = document.createElementNS(outer.namespaceURI, "g");
  g.setAttribute(
    "transform",
    `translate(${cardX + INNER - x}, ${cardY + INNER - y})`,
  );
  g.appendChild(source);
  outer.appendChild(g);

  return outer;
}

function formatHeaderSingleLine(h: ExportHeader): string {
  const bits: string[] = [];
  if (h.system) bits.push(`System: ${h.system}`);
  if (h.tuning)
    bits.push(
      `Tuning: ${Array.isArray(h.tuning) ? h.tuning.join(" ") : h.tuning}`,
    );
  if (h.scale) bits.push(`Scale: ${h.scale}`);
  if (h.chordEnabled && (h.chordRoot || h.chordType)) {
    bits.push(`Chord: ${[h.chordRoot, h.chordType].filter(Boolean).join(" ")}`);
  }
  return bits.join(" • ");
}

export async function downloadSVG(
  svgEl: SVGSVGElement,
  filename = "fretboard.svg",
  header: ExportHeader | null = null,
  padding = 16,
) {
  const svg = withPaddingAndHeader(svgEl, padding, header);
  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

export async function downloadPNG(
  svgEl: SVGSVGElement,
  filename = "fretboard.png",
  scale = 3,
  padding = 16,
  header: ExportHeader | null = null,
) {
  const svg = withPaddingAndHeader(svgEl, padding, header);
  const xml = new XMLSerializer().serializeToString(svg);
  const svgUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

  const img = await loadImage(svgUrl);

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(img.naturalWidth * scale);
  canvas.height = Math.ceil(img.naturalHeight * scale);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available.");

  ctx.imageSmoothingQuality = "high";
  ctx.imageSmoothingEnabled = true;

  ctx.fillStyle =
    getComputedStyle(document.documentElement).getPropertyValue("--panel") ||
    "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await canvasToBlob(canvas, "image/png");
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

export async function printFretboard(
  svgEl: SVGSVGElement,
  header: ExportHeader | null = null,
  padding = 16,
) {
  const svg = withPaddingAndHeader(svgEl, padding, header);
  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(`
    <!doctype html>
    <html>
      <head><meta charset="utf-8"><title>Print Fretboard</title></head>
      <body style="margin:0; padding:0; background:#fff;">
        <img src="${url}" style="max-width:100%; display:block; margin:0 auto;" onload="window.focus(); window.print();"/>
      </body>
    </html>
  `);
  w.document.close();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b!), type, quality),
  );
}
