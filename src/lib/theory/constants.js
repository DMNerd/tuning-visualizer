export const NOTES_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
export const NOTES_FLAT  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];

export const SCALES = {
  "Major (Ionian)":        [0,2,4,5,7,9,11],
  "Natural Minor (Aeolian)":[0,2,3,5,7,8,10],
  "Harmonic Minor":        [0,2,3,5,7,8,11],
  "Melodic Minor":         [0,2,3,5,7,9,11],
  "Dorian":                [0,2,3,5,7,9,10],
  "Phrygian":              [0,1,3,5,7,8,10],
  "Lydian":                [0,2,4,6,7,9,11],
  "Mixolydian":            [0,2,4,5,7,9,10],
  "Locrian":               [0,1,3,5,6,8,10],
  "Pentatonic Major":      [0,2,4,7,9],
  "Pentatonic Minor":      [0,3,5,7,10],
  "Blues Minor (hexatonic)":[0,3,5,6,7,10],
  "Whole Tone":            [0,2,4,6,8,10],
  "Chromatic":             [...Array(12).keys()]
};

export const DEGREE_NAMES = ["1","b2","2","b3","3","4","#4","5","b6","6","b7","7"];

export const DEFAULT_TUNINGS = {
  4: ["G","D","A","E"],
  6: ["E","B","G","D","A","E"],
  7: ["E","B","G","D","A","E","B"],
  8: ["E","B","G","D","A","E","B","F#"]
};
