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
  const b = svg.getBBox();
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
  const mustToggle = !!(opts?.forceTheme && prevTheme !== opts.forceTheme);

  try {
    if (mustToggle && opts?.forceTheme) {
      html.setAttribute("data-theme", opts.forceTheme);
    }
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
  const win = src.ownerDocument?.defaultView;
  if (!win) return;

  const srcDoc = src.ownerDocument;
  if (!srcDoc) return;
  const destDoc = dest.ownerDocument ?? document;

  const srcWalker = srcDoc.createTreeWalker(src, NodeFilter.SHOW_ELEMENT);
  const destWalker = destDoc.createTreeWalker(dest, NodeFilter.SHOW_ELEMENT);

  // Root first
  applyStyle(src, dest, win);

  // Walk both trees in lockstep
  while (true) {
    const s = srcWalker.nextNode() as Element | null;
    const d = destWalker.nextNode() as Element | null;
    if (!s || !d) break;
    applyStyle(s, d, win);
  }

  function applyStyle(from: Element, to: Element, w: Window) {
    const cs = w.getComputedStyle(from);

    const props = [
      "opacity",
      "font",
      "font-family",
      "font-size",
      "font-weight",
      "color",
      "fill",
      "stroke",
      "stroke-width",
      "stroke-linejoin",
      "stroke-linecap",
      "stroke-miterlimit",
      "stroke-opacity",
      "stroke-dasharray",
      "stroke-dashoffset",
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

  const headerStr = header ? formatHeaderSingleLine(header) : "";
  const hasHeader = headerStr.trim().length > 0;

  const HEADER_FONT_SIZE = 32;
  const HEADER_GAP = hasHeader ? 12 : 0;

  const CARD_RADIUS = 22;
  const CARD_BORDER = "#e6e6e6";

  const INNER = padding;
  const OUTER = 24;

  const cardW = width + INNER * 2;
  const cardH = height + INNER * 2;

  const totalW = cardW + OUTER * 2;
  // Baseline-friendly: reserve exactly font-size + gap when we have a header
  const headerBlock = hasHeader ? HEADER_FONT_SIZE + HEADER_GAP : 0;
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

  if (hasHeader) {
    const t = document.createElementNS(outer.namespaceURI, "text");
    t.textContent = headerStr;
    t.setAttribute("x", String(totalW / 2));
    t.setAttribute("y", String(OUTER + HEADER_FONT_SIZE));
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("xml:space", "preserve");
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

export function downloadSVG(
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

export function printFretboard(
  svgEl: SVGSVGElement,
  header: ExportHeader | null = null,
  padding = 16,
) {
  const svg = withPaddingAndHeader(svgEl, padding, header);
  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  iframe.onload = () => {
    const doc = iframe.contentDocument;
    if (!doc) {
      URL.revokeObjectURL(url);
      document.body.removeChild(iframe);
      return;
    }

    doc.body.style.margin = "0";
    doc.body.style.padding = "0";
    doc.body.style.background = "#fff";

    const img = doc.createElement("img");
    img.src = url;
    img.style.maxWidth = "100%";
    img.style.display = "block";
    img.style.margin = "0 auto";

    img.onload = () => {
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(iframe);
        }, 10000);
      }, 0);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      document.body.removeChild(iframe);
    };

    doc.body.appendChild(img);
  };

  iframe.srcdoc =
    "<!doctype html><html><head><meta charset='utf-8'></head><body></body></html>";
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
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to create blob from canvas."));
      },
      type,
      quality,
    );
  });
}
