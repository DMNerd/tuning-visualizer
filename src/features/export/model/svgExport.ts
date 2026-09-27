import {
  EXPORT_PADDING,
  type ExportHeader,
  withPaddingAndHeader,
} from "@features/export/model/svgExportComposition";

export { EXPORT_PADDING };
export const PNG_EXPORT_SCALE = 3;

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

function svgToBlobUrl(svg: SVGSVGElement) {
  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  return URL.createObjectURL(blob);
}

export function downloadSVG(
  svgEl: SVGSVGElement,
  filename = "fretboard.svg",
  header: ExportHeader | null = null,
  padding = EXPORT_PADDING,
) {
  const svg = withPaddingAndHeader(svgEl, padding, header);
  const url = svgToBlobUrl(svg);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

export async function downloadPNG(
  svgEl: SVGSVGElement,
  filename = "fretboard.png",
  scale = PNG_EXPORT_SCALE,
  padding = EXPORT_PADDING,
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
  padding = EXPORT_PADDING,
) {
  const svg = withPaddingAndHeader(svgEl, padding, header);
  const url = svgToBlobUrl(svg);

  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);

  const cleanup = () => {
    URL.revokeObjectURL(url);
    document.body.removeChild(iframe);
  };

  iframe.onload = () => {
    const doc = iframe.contentDocument;
    if (!doc) {
      cleanup();
      return;
    }

    Object.assign(doc.body.style, {
      margin: "0",
      padding: "0",
      background: "#fff",
    });

    const img = doc.createElement("img");
    img.src = url;
    Object.assign(img.style, {
      maxWidth: "100%",
      display: "block",
      margin: "0 auto",
    });

    img.onload = () => {
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(cleanup, 10000);
      }, 0);
    };
    img.onerror = cleanup;

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
