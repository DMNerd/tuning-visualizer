// Define scale patterns per tuning. Values are pitch-class indices for that system.
// For 24-TET, “double” the familiar 12-TET semitone steps (major ≈ 0,4,8,10,14,18,22).

export type ScaleDef = {
  label: string;
  systemId: "12-TET" | "24-TET"; // extend as you add more
  pcs: number[]; // pitch classes in that system
};

// 12-TET classics
export const SCALES_12: ScaleDef[] = [
  { label: "Major (Ionian)", systemId: "12-TET", pcs: [0, 2, 4, 5, 7, 9, 11] },
  {
    label: "Natural Minor (Aeolian)",
    systemId: "12-TET",
    pcs: [0, 2, 3, 5, 7, 8, 10],
  },
  { label: "Harmonic Minor", systemId: "12-TET", pcs: [0, 2, 3, 5, 7, 8, 11] },
];

// 24-TET variants (quarter-tone steps)
export const SCALES_24: ScaleDef[] = [
  // Simple “doubled” major:
  {
    label: "24TET Major (Ionian)",
    systemId: "24-TET",
    pcs: [0, 4, 8, 10, 14, 18, 22],
  },

  // Example quarter-tone flavors (you can add more later):
  {
    label: "24TET Neutral Heptatonic",
    systemId: "24-TET",
    pcs: [0, 4, 7, 12, 16, 19, 22],
  },
  {
    label: "24TET Hijaz-ish",
    systemId: "24-TET",
    pcs: [0, 3, 10, 12, 16, 18, 22],
  },
];

export const ALL_SCALES = [...SCALES_12, ...SCALES_24];
