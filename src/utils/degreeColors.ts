export interface DegreePaletteOptions {
  rootColor?: string;
  saturation?: number;
  lightness?: number;
  rotate?: number;
}

export function buildDegreePalette(
  k: number,
  options: DegreePaletteOptions = {},
): (string | undefined)[] {
  const {
    rootColor = "var(--root)",
    saturation = 70,
    lightness = 55,
    rotate = 0,
  } = options;

  const palette = new Array<string | undefined>(k + 1);

  palette[1] = rootColor;

  if (k <= 1) return palette;

  const others = k - 1;
  for (let i = 0; i < others; i++) {
    const hue = (rotate + (360 * i) / others) % 360;
    palette[i + 2] = `hsl(${Math.round(hue)} ${saturation}% ${lightness}%)`;
  }
  return palette;
}

export function getDegreeColor(
  degree: number,
  k: number,
  opts?: DegreePaletteOptions,
): string {
  if (!Number.isFinite(degree) || !Number.isFinite(k)) {
    return "var(--note)";
  }

  const safeDegree = Math.trunc(degree);
  const safeK = Math.trunc(k);

  if (safeDegree < 1 || safeK < 1) {
    return "var(--note)";
  }

  const palette = buildDegreePalette(safeK, opts);
  return palette[safeDegree] ?? "var(--note)";
}
