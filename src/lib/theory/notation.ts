const SHARP_EQUIVALENTS = /[♯＃]/g;
const FLAT_EQUIVALENTS = /[♭]/g;

function normalizeToken(token: unknown): string {
  if (typeof token !== "string") return "";
  return token
    .trim()
    .replace(SHARP_EQUIVALENTS, "#")
    .replace(FLAT_EQUIVALENTS, "b");
}

function splitArrowDecorations(note: unknown): { core: string; suffix: string } {
  if (typeof note !== "string" || note.length === 0) {
    return { core: "", suffix: "" };
  }
  const match = note.match(/[↑↓]+$/u);
  if (!match) return { core: note, suffix: "" };
  const suffix = match[0] ?? "";
  const core = note.slice(0, -suffix.length);
  return { core, suffix };
}

function splitGermanMicroDecorations(note: unknown): {
  core: string;
  suffix: string;
} {
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

function toGermanCore(englishCore: string): string {
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

function fromGermanCore(germanCore: unknown): string {
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
  if (naturals.has(normalized)) return naturals.get(normalized) ?? "";

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

function toGermanMicroSuffix(arrowSuffix: string): string {
  if (!arrowSuffix) return "";
  return arrowSuffix.replace(/↑/gu, "ih").replace(/↓/gu, "eh");
}

function toArrowSuffixFromGerman(germanSuffix: string): string {
  if (!germanSuffix) return "";
  return germanSuffix.replace(/IH/gu, "↑").replace(/EH/gu, "↓");
}

export function toGermanNoteName(note: unknown): string {
  const { core, suffix } = splitArrowDecorations(note);
  const germanCore = toGermanCore(core);
  const germanSuffix = toGermanMicroSuffix(suffix);
  return `${germanCore}${germanSuffix}`;
}

export function germanToEnglishNoteName(note: unknown): string {
  const withArrows = splitArrowDecorations(note);
  if (withArrows.suffix) {
    return `${fromGermanCore(withArrows.core)}${withArrows.suffix}`;
  }

  const { core, suffix } = splitGermanMicroDecorations(note);
  const arrowSuffix = toArrowSuffixFromGerman(suffix.toUpperCase());
  return `${fromGermanCore(core)}${arrowSuffix}`;
}

export function renderNoteName(note: string, noteNaming = "english"): string {
  if (noteNaming === "german") {
    return toGermanNoteName(note);
  }
  return note;
}

export function buildNoteAliases(note: string): Set<string> {
  const aliases = new Set<string>();
  if (typeof note !== "string" || note.length === 0) return aliases;

  aliases.add(note);
  const german = toGermanNoteName(note);
  if (german) aliases.add(german);

  const englishFromGerman = germanToEnglishNoteName(note);
  if (englishFromGerman) aliases.add(englishFromGerman);

  return aliases;
}

const CANONICAL_MARKERS = ["german", "czech", "de h/b"] as const;

const ALIAS_TO_CANONICAL: Record<string, (typeof CANONICAL_MARKERS)[number]> = {
  german: "german",
  germanic: "german",
  czech: "czech",
  cz: "czech",
  de: "de h/b",
  "de h/b": "de h/b",
  "de-h/b": "de h/b",
  "de_h/b": "de h/b",
  "de h b": "de h/b",
  "h/b": "de h/b",
};

export const SPELLING_MARKER_CANONICAL = Object.freeze(CANONICAL_MARKERS);
export const SPELLING_MARKER_ALIASES = Object.freeze(ALIAS_TO_CANONICAL);
export const SPELLING_MARKER_DISPLAY = Object.freeze([
  "german",
  "czech",
  "cz",
  "de-h/b",
  "de_h/b",
]);

export function normalizeSpellingMarker(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/gu, " ")
    .replace(/\s+/gu, " ");
}

export function resolveSpellingMarker(value: unknown): string {
  const normalized = normalizeSpellingMarker(value);
  if (!normalized) return "";
  return ALIAS_TO_CANONICAL[normalized] || "";
}

export function isGermanicSpellingMarker(value: unknown): boolean {
  return Boolean(resolveSpellingMarker(value));
}

export function normalizeIntlNoteName(note: unknown, options = {}): unknown {
  const { translateGerman = false } = options as { translateGerman?: boolean };
  if (typeof note !== "string") return note;

  const trimmed = note.trim();
  if (!trimmed) return "";
  if (!translateGerman) return trimmed;

  const translated = germanToEnglishNoteName(trimmed);
  return translated || trimmed;
}

export function normalizeSpellingHint(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}
