const SHAPE_COLOR_PALETTE = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#facc15", // yellow
  "#22c55e", // green
  "#7c3aed", // violet
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
];

export function getShapeColor(index: number): string {
  if (!Number.isFinite(index) || index < 0) return SHAPE_COLOR_PALETTE[0];
  return SHAPE_COLOR_PALETTE[index % SHAPE_COLOR_PALETTE.length];
}

export function getShapePaletteSize(): number {
  return SHAPE_COLOR_PALETTE.length;
}
