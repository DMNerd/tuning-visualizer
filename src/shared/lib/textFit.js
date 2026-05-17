import {
  prepare,
  layout,
  prepareWithSegments,
  layoutWithLines,
} from "@chenglou/pretext";

const DEFAULT_FONT_FAMILY =
  'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

function supportsCanvasTextMeasurement() {
  return (
    typeof OffscreenCanvas !== "undefined" ||
    (typeof document !== "undefined" &&
      typeof document.createElement === "function")
  );
}

export function createTextFit({
  fontFamily = DEFAULT_FONT_FAMILY,
  fallbackWidthFactor = 0.58,
  forceFallback = false,
} = {}) {
  const widthCache = new Map();
  const wrappedCache = new Map();
  let disablePretext = forceFallback || !supportsCanvasTextMeasurement();

  const resolveFont = ({
    fontWeight = 500,
    fontSize = 12,
    fontFamily: familyOverride,
  } = {}) => `${fontWeight} ${fontSize}px ${familyOverride ?? fontFamily}`;

  const fallbackWidth = (text, fontSize) =>
    text.length * fontSize * fallbackWidthFactor;

  const measureWidth = (text, fontSpec = {}) => {
    if (!text) return 0;
    const fontSize = fontSpec.fontSize ?? 12;
    const font = resolveFont(fontSpec);
    const key = `${font}|${text}`;
    const cached = widthCache.get(key);
    if (cached != null) return cached;

    let value = fallbackWidth(text, fontSize);
    if (!disablePretext) {
      try {
        const prepared = prepareWithSegments(text, font);
        const measured = layoutWithLines(prepared, Number.MAX_SAFE_INTEGER, 1);
        value = measured.lines[0]?.width ?? value;
      } catch {
        disablePretext = true;
      }
    }

    widthCache.set(key, value);
    return value;
  };

  const fitLabel = (
    variants,
    maxWidth,
    {
      sizeRange = { min: 6, max: 11.5, step: 0.5 },
      fontWeight = 700,
      allowSingleCharFallback = true,
      fontFamily: familyOverride,
    } = {},
  ) => {
    if (!Array.isArray(variants) || variants.length === 0) return null;
    const uniqueVariants = Array.from(new Set(variants.filter(Boolean)));
    const candidates = allowSingleCharFallback
      ? uniqueVariants
      : uniqueVariants.filter((v) => v.length > 1);
    const finalCandidates = candidates.length ? candidates : uniqueVariants;
    const step = Math.abs(sizeRange.step ?? 0.5) || 0.5;

    for (let i = 0; i < finalCandidates.length; i += 1) {
      const candidate = finalCandidates[i];
      for (let size = sizeRange.max; size >= sizeRange.min; size -= step) {
        if (
          measureWidth(candidate, {
            fontWeight,
            fontSize: size,
            fontFamily: familyOverride,
          }) <= maxWidth
        ) {
          return { text: candidate, fontSize: size };
        }
      }
    }
    return null;
  };

  const estimateWrappedLines = (
    text,
    width,
    {
      lineHeight = 16,
      fontWeight = 500,
      fontSize = 12,
      fontFamily: familyOverride,
      widthBucket = 8,
    } = {},
  ) => {
    if (!text) return 1;
    const bucket = Math.max(1, Math.round(width / widthBucket) * widthBucket);
    const font = resolveFont({
      fontWeight,
      fontSize,
      fontFamily: familyOverride,
    });
    const key = `${font}|${text}|${bucket}|${lineHeight}`;
    const cached = wrappedCache.get(key);
    if (cached != null) return cached;

    const approxWidth = fallbackWidth(text, fontSize);
    let lineCount = Math.max(1, Math.ceil(approxWidth / Math.max(1, bucket)));
    if (!disablePretext) {
      try {
        const measured = layout(prepare(text, font), bucket, lineHeight);
        lineCount = Math.max(1, measured.lineCount);
      } catch {
        disablePretext = true;
      }
    }

    wrappedCache.set(key, lineCount);
    return lineCount;
  };

  const clearCache = () => {
    widthCache.clear();
    wrappedCache.clear();
  };

  return {
    measureWidth,
    fitLabel,
    estimateWrappedLines,
    clearCache,
  };
}
