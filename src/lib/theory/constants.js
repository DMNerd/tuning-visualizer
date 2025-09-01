// Default tunings per temperament & string count.
// These are the "factory" defaults the app uses when no user default is saved.
export const DEFAULT_TUNINGS = {
  "12-TET": {
    // Violin / Mandolin family (high → low)
    4: ["G", "D", "A", "E"],

    // Guitar family (high → low)
    6: ["E", "B", "G", "D", "A", "E"],
    7: ["E", "B", "G", "D", "A", "E", "B"],
    8: ["E", "B", "G", "D", "A", "E", "B", "F#"],
  },

  "24-TET": {
    // Same concert-pitch names (even PCs in 24-TET)
    4: ["G", "D", "A", "E"],
    6: ["E", "B", "G", "D", "A", "E"],
    7: ["E", "B", "G", "D", "A", "E", "B"],
    8: ["E", "B", "G", "D", "A", "E", "B", "F#"],

  },
};

/**
 * Named (built-in) presets per temperament & string count.
 * Keys are human-friendly names shown in the UI.
 * Arrays are ordered high → low to match the app’s convention.
 */
export const PRESET_TUNINGS = {
  "12-TET": {
    // 4-string: common double-courses & short-scale instruments
    4: {
      "Mandolin / Violin (GDAE)": ["G", "D", "A", "E"],
      "Tenor Banjo (CGDA)": ["A", "D", "G", "C"],
      "Ukulele (GCEA, re-entrant)": ["A", "E", "C", "G"],
      "Baritone Uke (DGBE)": ["E", "B", "G", "D"],
      "Bass (EADG, high→low)": ["G", "D", "A", "E"], 
    },

    // 6-string guitar
    6: {
      "Standard (EADGBE)": ["E", "B", "G", "D", "A", "E"],
      "Drop D": ["E", "B", "G", "D", "A", "D"],
      DADGAD: ["D", "A", "G", "D", "A", "D"],
      "Open G (DGDGBD)": ["D", "B", "G", "D", "G", "D"],
      "Open D (DADF#AD)": ["D", "A", "F#", "D", "A", "D"],
      "Open C (CGCGCE)": ["E", "C", "G", "C", "G", "C"],
      "Open E (EBEG#BE)": ["E", "B", "G#", "E", "B", "E"],
      "All Fourths (EADGCF)": ["F", "C", "G", "D", "A", "E"],
      "Half-Step Down (Eb Ab Db Gb Bb Eb)": [
        "Eb",
        "Bb",
        "Gb",
        "Db",
        "Ab",
        "Eb",
      ],
      "C Standard (C F Bb Eb G C)": ["C", "G", "Eb", "Bb", "F", "C"],
      "Open A (EAEAC#E)": ["E", "C#", "A", "E", "A", "E"],
      "Open B (F#BF#B D# F#)": ["F#", "D#", "B", "F#", "B", "F#"],
    },

    // 7-string guitar
    7: {
      "Standard 7 (BEADGBE)": ["E", "B", "G", "D", "A", "E", "B"],
      "Drop A (AEADGBE)": ["E", "B", "G", "D", "A", "E", "A"],
      "All Fourths 7 (EADGCF Bb)": ["Bb", "F", "C", "G", "D", "A", "E"],
    },

    // 8-string guitar
    8: {
      "Standard 8 (F#BEADGBE)": ["E", "B", "G", "D", "A", "E", "B", "F#"],
      "Drop E (EBEADGBE)": ["E", "B", "G", "D", "A", "E", "B", "E"],
      "All Fourths 8 (EADGCF Bb Eb)": [
        "Eb",
        "Bb",
        "F",
        "C",
        "G",
        "D",
        "A",
        "E",
      ],
    },
  },

  "24-TET": {
    // 4-string in 24-TET
    4: {
      "Mandolin / Violin (GDAE)": ["G", "D", "A", "E"],
      "Tenor Banjo (CGDA)": ["A", "D", "G", "C"],
      "Ukulele (GCEA, re-entrant)": ["A", "E", "C", "G"],
      // Microtonal flavors (quarter-tone accents)
      "Mandolin +Q on A (A↑)": ["G", "D", "A↑", "E"],
    },

    // 6-string, quarter-tone flavors
    6: {
      "Standard (EADGBE)": ["E", "B", "G", "D", "A", "E"],
      "Drop D": ["E", "B", "G", "D", "A", "D"],
      DADGAD: ["D", "A", "G", "D", "A", "D"],

      // Microtonal variants
      "Std +Q G string (G↑)": ["E", "B", "G↑", "D", "A", "E"],
      "Std +Q B string (B↑)": ["E", "B↑", "G", "D", "A", "E"],
      "Std −Q B string (B↓)": ["E", "B↓", "G", "D", "A", "E"],
      "Open D (quarter-bright 3rd, F#↑)": ["D", "A", "F#↑", "D", "A", "D"],

      // 🎶 King Gizzard preset
      "King Gizzard (C#F#C#F#BE)": ["E", "B", "F#", "C#", "F#", "C#"],
    },

    7: {
      "Standard 7 (BEADGBE)": ["E", "B", "G", "D", "A", "E", "B"],
      "Drop A": ["E", "B", "G", "D", "A", "E", "A"],
      "Std +Q middle (G↑)": ["E", "B", "G↑", "D", "A", "E", "B"],
    },

    8: {
      "Standard 8 (F#BEADGBE)": ["E", "B", "G", "D", "A", "E", "B", "F#"],
      "Drop E 8": ["E", "B", "G", "D", "A", "E", "B", "E"],
      "Std +Q B string (B↑)": ["E", "B↑", "G", "D", "A", "E", "B", "F#"],
    },
  },
};
