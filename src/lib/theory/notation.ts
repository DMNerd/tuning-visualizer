import {
  buildNoteAliases,
  germanToEnglishNoteName,
  renderNoteName,
} from "@/lib/theory/noteNaming";

export { buildNoteAliases, germanToEnglishNoteName, renderNoteName };

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
