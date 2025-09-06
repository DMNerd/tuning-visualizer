export function buildDegreePalette(
  k,
  {
    rootColor = "var(--root)",
    saturation = 70,
    lightness = 55,
    rotate = 0,
  } = {},
) {
  // Ensure array indices 1..k are valid
  const palette = new Array(k + 1);

  // Degree 1 (tonic) should stand out and match your theme
  palette[1] = rootColor;

  if (k <= 1) return palette;

  // Spread remaining degrees evenly across the hue circle
  const others = k - 1;
  for (let i = 0; i < others; i++) {
    const hue = (rotate + (360 * i) / others) % 360;
    palette[i + 2] = `hsl(${Math.round(hue)} ${saturation}% ${lightness}%)`;
  }
  return palette;
}

export function getDegreeColor(degree, k, opts) {
  if (!Number.isFinite(degree) || degree < 1 || !Number.isFinite(k) || k < 1) {
    return "var(--note)";
  }
  const palette = buildDegreePalette(k, opts);
  return palette[degree] || "var(--note)";
}
