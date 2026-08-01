import { uniq } from "@shared/lib/object";

export const NOTE_FONT_MIN = 6;
export const NOTE_FONT_MAX = 11.5;
export const SPLIT_NOTE_FONT_MIN = 5.5;
export const SPLIT_NOTE_FONT_MAX = 9.5;
export const MARKER_FONT_MIN = 6;
export const MARKER_FONT_MAX = 11.5;
const NOTE_TEXT_PADDING = 2;

export function estimateMinimumDotSize({
  textFit,
  divisions,
  nameForPc,
  accidental,
}) {
  if (!textFit || typeof nameForPc !== "function") return 8;
  let requiredRadius = 8;

  for (let pc = 0; pc < divisions; pc += 1) {
    const label = String(nameForPc(pc) ?? "");
    if (!label) continue;

    if (accidental === "both" && label.includes("/")) {
      const [upper = "", lower = ""] = label.split("/");
      const upperW = textFit.measureWidth(upper, {
        fontWeight: 700,
        fontSize: SPLIT_NOTE_FONT_MAX,
      });
      const lowerW = textFit.measureWidth(lower, {
        fontWeight: 700,
        fontSize: SPLIT_NOTE_FONT_MAX,
      });
      requiredRadius = Math.max(
        requiredRadius,
        Math.max(upperW, lowerW) / 1.7 + NOTE_TEXT_PADDING,
      );
      continue;
    }

    const width = textFit.measureWidth(label, {
      fontWeight: 700,
      fontSize: NOTE_FONT_MAX,
    });
    requiredRadius = Math.max(requiredRadius, width / 1.65 + NOTE_TEXT_PADDING);
  }

  return Math.ceil(requiredRadius);
}

export function buildLabelVariants(
  label,
  { kind, allowSingleCharFallback = true },
) {
  const compact = label.replace(/\s+/g, "");
  const variants = [compact];

  if (kind === "note") {
    if (compact.includes("/")) {
      variants.push(compact.split("/")[0]);
    }
    variants.push(compact.slice(0, 2));
    if (allowSingleCharFallback) variants.push(compact.slice(0, 1));
    return uniq(variants.filter(Boolean));
  }

  if (compact.includes("+")) {
    const [base, fracRaw] = compact.split("+");
    const frac = fracRaw ?? "";
    const slashChar = frac.includes("⁄") ? "⁄" : frac.includes("/") ? "/" : "";
    if (slashChar) {
      const [num = "", den = ""] = frac.split(slashChar);
      variants.push(`${base}+${num}${slashChar}${den}`);
      variants.push(`${base}+${num}${slashChar}…`);
      variants.push(`${base}+…${slashChar}${den}`);
      variants.push(`${base}+${num}`);
    }
  } else if (compact.includes("/") || compact.includes("⁄")) {
    const slashChar = compact.includes("⁄") ? "⁄" : "/";
    const [left = "", right = ""] = compact.split(slashChar);
    variants.push(`${left}${slashChar}…`);
    variants.push(`…${slashChar}${right}`);
  }

  variants.push(compact.slice(0, 2));
  if (allowSingleCharFallback) variants.push(compact.slice(0, 1));
  return uniq(variants.filter(Boolean));
}

export function buildFitCacheKey({
  variants,
  maxWidth,
  minFontSize,
  maxFontSize,
  step,
  fontWeight,
  allowSingleCharFallback,
}) {
  return [
    variants.join("␟"),
    Number(maxWidth).toFixed(3),
    Number(minFontSize).toFixed(3),
    Number(maxFontSize).toFixed(3),
    Number(step).toFixed(3),
    fontWeight,
    allowSingleCharFallback ? "1" : "0",
  ].join("|");
}

export function buildWidthCacheKey({ label, fontSize, fontWeight }) {
  return [
    label,
    Number(fontSize).toFixed(3),
    Number(fontWeight).toFixed(3),
  ].join("|");
}
