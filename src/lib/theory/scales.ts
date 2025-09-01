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

  // Church modes
  { label: "Dorian", systemId: "12-TET", pcs: [0, 2, 3, 5, 7, 9, 10] },
  { label: "Phrygian", systemId: "12-TET", pcs: [0, 1, 3, 5, 7, 8, 10] },
  { label: "Lydian", systemId: "12-TET", pcs: [0, 2, 4, 6, 7, 9, 11] },
  { label: "Mixolydian", systemId: "12-TET", pcs: [0, 2, 4, 5, 7, 9, 10] },
  { label: "Locrian", systemId: "12-TET", pcs: [0, 1, 3, 5, 6, 8, 10] },

  // Melodic / harmonic variants
  {
    label: "Melodic Minor (asc.)",
    systemId: "12-TET",
    pcs: [0, 2, 3, 5, 7, 9, 11],
  },
  { label: "Harmonic Major", systemId: "12-TET", pcs: [0, 2, 4, 5, 7, 8, 11] },
  {
    label: "Double Harmonic Major",
    systemId: "12-TET",
    pcs: [0, 1, 4, 5, 7, 8, 11],
  },
  { label: "Hungarian Minor", systemId: "12-TET", pcs: [0, 2, 3, 6, 7, 8, 11] },
  {
    label: "Phrygian Dominant",
    systemId: "12-TET",
    pcs: [0, 1, 4, 5, 7, 8, 10],
  },

  // Pentatonics & blues
  { label: "Major Pentatonic", systemId: "12-TET", pcs: [0, 2, 4, 7, 9] },
  { label: "Minor Pentatonic", systemId: "12-TET", pcs: [0, 3, 5, 7, 10] },
  { label: "Blues (Hexatonic)", systemId: "12-TET", pcs: [0, 3, 5, 6, 7, 10] },

  // Symmetric scales
  {
    label: "Whole Tone (Hexatonic)",
    systemId: "12-TET",
    pcs: [0, 2, 4, 6, 8, 10],
  },
  {
    label: "Diminished (H-W Octatonic)",
    systemId: "12-TET",
    pcs: [0, 1, 3, 4, 6, 7, 9, 10],
  },
  {
    label: "Diminished (W-H Octatonic)",
    systemId: "12-TET",
    pcs: [0, 2, 3, 5, 6, 8, 9, 11],
  },
  {
    label: "Chromatic (12)",
    systemId: "12-TET",
    pcs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },

  // Bebop flavors
  {
    label: "Bebop Dominant (8)",
    systemId: "12-TET",
    pcs: [0, 2, 4, 5, 7, 9, 10, 11],
  },
  {
    label: "Bebop Major (8)",
    systemId: "12-TET",
    pcs: [0, 2, 4, 5, 7, 8, 9, 11],
  },
];

// 24-TET variants (quarter-tone steps)
export const SCALES_24: ScaleDef[] = [
  // Doubled versions of common 12-TET scales (multiply by 2)
  {
    label: "24TET Major (Ionian)",
    systemId: "24-TET",
    pcs: [0, 4, 8, 10, 14, 18, 22],
  },
  {
    label: "24TET Natural Minor (Aeolian)",
    systemId: "24-TET",
    pcs: [0, 4, 6, 10, 14, 16, 20],
  },
  {
    label: "24TET Harmonic Minor",
    systemId: "24-TET",
    pcs: [0, 4, 6, 10, 14, 16, 22],
  },
  {
    label: "24TET Dorian (doubled)",
    systemId: "24-TET",
    pcs: [0, 4, 6, 10, 14, 18, 20],
  },
  {
    label: "24TET Phrygian (doubled)",
    systemId: "24-TET",
    pcs: [0, 2, 6, 10, 14, 16, 20],
  },
  {
    label: "24TET Lydian (doubled)",
    systemId: "24-TET",
    pcs: [0, 4, 8, 12, 14, 18, 22],
  },
  {
    label: "24TET Mixolydian (doubled)",
    systemId: "24-TET",
    pcs: [0, 4, 8, 10, 14, 18, 20],
  },
  {
    label: "24TET Locrian (doubled)",
    systemId: "24-TET",
    pcs: [0, 2, 6, 10, 12, 16, 20],
  },
  {
    label: "24TET Melodic Minor (asc., doubled)",
    systemId: "24-TET",
    pcs: [0, 4, 6, 10, 14, 18, 22],
  },
  {
    label: "24TET Harmonic Major (doubled)",
    systemId: "24-TET",
    pcs: [0, 4, 8, 10, 14, 16, 22],
  },
  {
    label: "24TET Double Harmonic Major (doubled)",
    systemId: "24-TET",
    pcs: [0, 2, 8, 10, 14, 16, 22],
  },
  {
    label: "24TET Hungarian Minor (doubled)",
    systemId: "24-TET",
    pcs: [0, 4, 6, 12, 14, 16, 22],
  },
  {
    label: "24TET Phrygian Dominant (doubled)",
    systemId: "24-TET",
    pcs: [0, 2, 8, 10, 14, 16, 20],
  },

  // Pentatonics / blues (doubled)
  {
    label: "24TET Major Pentatonic (doubled)",
    systemId: "24-TET",
    pcs: [0, 4, 8, 14, 18],
  },
  {
    label: "24TET Minor Pentatonic (doubled)",
    systemId: "24-TET",
    pcs: [0, 6, 10, 14, 20],
  },
  {
    label: "24TET Blues (Hexatonic, doubled)",
    systemId: "24-TET",
    pcs: [0, 6, 10, 12, 14, 20],
  },

  // Symmetric (doubled)
  {
    label: "24TET Whole Tone (doubled)",
    systemId: "24-TET",
    pcs: [0, 4, 8, 12, 16, 20],
  },
  {
    label: "24TET Diminished (H-W, doubled)",
    systemId: "24-TET",
    pcs: [0, 2, 6, 8, 12, 14, 18, 20],
  },
  {
    label: "24TET Diminished (W-H, doubled)",
    systemId: "24-TET",
    pcs: [0, 4, 6, 10, 12, 16, 18, 22],
  },
  {
    label: "24TET Chromatic (24)",
    systemId: "24-TET",
    pcs: Array.from({ length: 24 }, (_, i) => i),
  },

  // Quarter-tone-native flavors
  // Neutral steps (~150c) used for “neutral 3rd/6th” colorations
  {
    label: "24TET Neutral Heptatonic",
    systemId: "24-TET",
    pcs: [0, 4, 7, 12, 16, 19, 22],
  },
  {
    label: "24TET Major w/ Neutral 3rd",
    systemId: "24-TET",
    pcs: [0, 4, 7, 10, 14, 18, 22],
  },
  {
    label: "24TET Minor w/ Neutral 6th",
    systemId: "24-TET",
    pcs: [0, 4, 6, 10, 14, 17, 20],
  },

  // “Hijaz-ish” color (aug 2 + min 3 in lower tetrachord)
  {
    label: "24TET Hijaz-ish",
    systemId: "24-TET",
    pcs: [0, 3, 10, 12, 16, 18, 22],
  },

  // Neutral pentatonic (roughly equidistant-ish without semitones)
  {
    label: "24TET Neutral Pentatonic",
    systemId: "24-TET",
    pcs: [0, 4, 9, 14, 19],
  },
];

export const ALL_SCALES = [...SCALES_12, ...SCALES_24];
