// Builds the export artwork: a light-theme copy of the fretboard SVG with
// computed styles inlined, framed on a card with an optional one-line header.

export const EXPORT_PADDING = 16;

export type ExportHeader = {
  system?: string;
  tuning?: string | string[];
  scale?: string;
  spelling?: string;
  accidental?: string;
  strings?: number;
  chordEnabled?: boolean;
  chordRoot?: string;
  chordType?: string;
};

type Box = { x: number; y: number; width: number; height: number };

const SVG_NS = "http://www.w3.org/2000/svg";
const ACCIDENTAL_SYMBOLS: Record<string, string> = {
  flat: "♭",
  sharp: "♯",
  both: "♯/♭",
};

type SvgAttrs = Record<string, string | number>;

function createSvgElement(
  doc: Document,
  tag: string,
  attrs: SvgAttrs,
): SVGElement {
  const el = doc.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, String(value));
  }
  return el;
}

function appendSvgElement(
  parent: SVGElement,
  tag: string,
  attrs: SvgAttrs,
): SVGElement {
  const el = createSvgElement(parent.ownerDocument, tag, attrs);
  parent.appendChild(el);
  return el;
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

export function withPaddingAndHeader(
  svg: SVGSVGElement,
  padding = EXPORT_PADDING,
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

  const outer = createSvgElement(document, "svg", {
    xmlns: SVG_NS,
    width: totalW,
    height: totalH,
    viewBox: `0 0 ${totalW} ${totalH}`,
  }) as SVGSVGElement;

  appendSvgElement(outer, "rect", {
    x: 0,
    y: 0,
    width: totalW,
    height: totalH,
    fill: "#0b0b0b",
  });

  if (hasHeader) {
    const t = appendSvgElement(outer, "text", {
      x: totalW / 2,
      y: OUTER + HEADER_FONT_SIZE,
      "text-anchor": "middle",
      "xml:space": "preserve",
      "font-family": "system-ui,-apple-system,Segoe UI,Roboto,Inter,sans-serif",
      "font-size": HEADER_FONT_SIZE,
      "font-weight": "800",
      fill: "#ffffff",
    });
    t.textContent = headerStr;
  }

  const cardX = OUTER;
  const cardY = OUTER + headerBlock;

  appendSvgElement(outer, "rect", {
    x: cardX,
    y: cardY,
    width: cardW,
    height: cardH,
    rx: CARD_RADIUS,
    ry: CARD_RADIUS,
    fill: "#ffffff",
    stroke: CARD_BORDER,
    "stroke-width": "1",
  });

  const g = appendSvgElement(outer, "g", {
    transform: `translate(${cardX + INNER - x}, ${cardY + INNER - y})`,
  });
  g.appendChild(source);

  return outer;
}

export function formatHeaderSingleLine(h: ExportHeader): string {
  const primary: string[] = [];
  const meta: string[] = [];

  if (h.system) primary.push(h.system);
  if (h.tuning) {
    if (Array.isArray(h.tuning)) {
      const previewCount = 8;
      const base = h.tuning.slice(0, previewCount).join(" ");
      const extra = h.tuning.length - previewCount;
      primary.push(extra > 0 ? `${base} …(+${extra})` : base);
    } else {
      primary.push(h.tuning);
    }
  }
  if (h.scale) primary.push(h.scale);
  if (h.chordEnabled && (h.chordRoot || h.chordType)) {
    primary.push([h.chordRoot, h.chordType].filter(Boolean).join(" "));
  }

  if (typeof h.strings === "number" && Number.isFinite(h.strings)) {
    meta.push(`${h.strings}str`);
  }
  const accidentalSymbol = h.accidental && ACCIDENTAL_SYMBOLS[h.accidental];
  if (accidentalSymbol) meta.push(accidentalSymbol);
  if (h.spelling) meta.push(h.spelling);

  if (meta.length) primary.push(meta.join(" · "));
  return primary.join(" • ");
}
