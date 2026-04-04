const SHARP_EQUIVALENTS = /[♯＃]/g;
const FLAT_EQUIVALENTS = /[♭]/g;

function normalizeToken(token) {
  if (typeof token !== "string") return "";
  return token
    .trim()
    .replace(SHARP_EQUIVALENTS, "#")
    .replace(FLAT_EQUIVALENTS, "b");
}

function splitArrowDecorations(note) {
  if (typeof note !== "string" || note.length === 0) {
    return { core: "", suffix: "" };
  }
  const match = note.match(/[↑↓]+$/u);
  if (!match) return { core: note, suffix: "" };
  const suffix = match[0] ?? "";
  const core = note.slice(0, -suffix.length);
  return { core, suffix };
}

function splitGermanMicroDecorations(note) {
  if (typeof note !== "string" || note.length === 0) {
    return { core: "", suffix: "" };
  }
  const upper = note.toUpperCase();
  if (upper.endsWith("IH")) {
    return { core: note.slice(0, -2), suffix: "IH" };
  }
  if (upper.endsWith("EH")) {
    return { core: note.slice(0, -2), suffix: "EH" };
  }
  return { core: note, suffix: "" };
}

function toGermanCore(englishCore) {
  const normalized = normalizeToken(englishCore);
  const m = normalized.match(/^([A-Ga-g])([#b]*)$/);
  if (!m) return englishCore;

  const letter = m[1].toUpperCase();
  const accidentals = m[2] ?? "";
  const hasSharps = /^#+$/.test(accidentals);
  const hasFlats = /^b+$/.test(accidentals);
  const base = letter === "B" ? "H" : letter;

  if (accidentals.length === 0) return base;

  if (hasSharps) {
    return `${base}${"is".repeat(accidentals.length)}`;
  }

  if (hasFlats) {
    if (letter === "B") {
      if (accidentals.length === 1) return "B";
      return `H${"es".repeat(accidentals.length)}`;
    }
    if (accidentals.length === 1 && (base === "A" || base === "E")) {
      return `${base}s`;
    }
    return `${base}${"es".repeat(accidentals.length)}`;
  }

  return englishCore;
}

function fromGermanCore(germanCore) {
  if (typeof germanCore !== "string") return "";
  const normalized = germanCore.trim().toUpperCase();
  if (!normalized) return "";

  if (normalized === "B") return "Bb";

  const naturals = new Map([
    ["A", "A"],
    ["C", "C"],
    ["D", "D"],
    ["E", "E"],
    ["F", "F"],
    ["G", "G"],
    ["H", "B"],
  ]);
  if (naturals.has(normalized)) return naturals.get(normalized);

  const sharpMatch = normalized.match(/^([A-H])(IS)+$/);
  if (sharpMatch) {
    const base = sharpMatch[1] === "H" ? "B" : sharpMatch[1];
    const count = (normalized.length - sharpMatch[1].length) / 2;
    return `${base}${"#".repeat(count)}`;
  }

  const singleS = normalized.match(/^([AE])S$/);
  if (singleS) {
    return `${singleS[1]}b`;
  }

  const flatMatch = normalized.match(/^([A-H])(ES)+$/);
  if (flatMatch) {
    const base = flatMatch[1] === "H" ? "B" : flatMatch[1];
    const count = (normalized.length - flatMatch[1].length) / 2;
    return `${base}${"b".repeat(count)}`;
  }

  return germanCore;
}

function toGermanMicroSuffix(arrowSuffix) {
  if (!arrowSuffix) return "";
  return arrowSuffix.replace(/↑/gu, "ih").replace(/↓/gu, "eh");
}

function toArrowSuffixFromGerman(germanSuffix) {
  if (!germanSuffix) return "";
  return germanSuffix.replace(/IH/gu, "↑").replace(/EH/gu, "↓");
}

export function toGermanNoteName(note) {
  const { core, suffix } = splitArrowDecorations(note);
  const germanCore = toGermanCore(core);
  const germanSuffix = toGermanMicroSuffix(suffix);
  return `${germanCore}${germanSuffix}`;
}

export function germanToEnglishNoteName(note) {
  const withArrows = splitArrowDecorations(note);
  if (withArrows.suffix) {
    return `${fromGermanCore(withArrows.core)}${withArrows.suffix}`;
  }

  const { core, suffix } = splitGermanMicroDecorations(note);
  const arrowSuffix = toArrowSuffixFromGerman(suffix.toUpperCase());
  return `${fromGermanCore(core)}${arrowSuffix}`;
}

export function renderNoteName(note, noteNaming = "english") {
  if (noteNaming === "german") {
    return toGermanNoteName(note);
  }
  return note;
}

export function buildNoteAliases(note) {
  const aliases = new Set();
  if (typeof note !== "string" || note.length === 0) return aliases;

  aliases.add(note);
  const german = toGermanNoteName(note);
  if (german) aliases.add(german);

  const englishFromGerman = germanToEnglishNoteName(note);
  if (englishFromGerman) aliases.add(englishFromGerman);

  return aliases;
}
