import { isPlainObject } from "@/utils/object";
import { STR_MAX, STR_MIN } from "@/lib/config/appDefaults";
import {
  isGermanicSpellingMarker,
  normalizeSpellingHint,
  renderNoteName,
} from "@/lib/theory/notation";
import {
  TUNINGS,
  findSystemByEdo,
  getSystemLabel,
  nameFallback,
} from "@/lib/theory/tuning";

const TEMPLATE_STRINGS = [
  { label: "String 1", note: "E4" },
  { label: "String 2", note: "B3" },
  { label: "String 3", note: "G3" },
  { label: "String 4", note: "D3" },
];

function pushUnique(list, seen, value) {
  if (typeof value !== "string") return;
  const normalized = value.trim();
  if (!normalized.length || seen.has(normalized)) return;
  seen.add(normalized);
  list.push(normalized);
}

export function ensurePack(pack) {
  const base = {
    name: "",
    system: { edo: 12 },
    tuning: { strings: [] },
    meta: {},
  };

  if (!isPlainObject(pack)) {
    return base;
  }

  const name = typeof pack.name === "string" ? pack.name : "";

  const edo = Number(pack?.system?.edo);
  const system = Number.isFinite(edo) && edo > 0 ? { edo } : { edo: 12 };

  const strings = Array.isArray(pack?.tuning?.strings)
    ? pack.tuning.strings
    : [];

  const meta = isPlainObject(pack.meta) ? pack.meta : {};
  const spelling = normalizeSpellingHint(pack.spelling);

  const normalized = {
    name,
    system,
    tuning: { strings },
    meta,
  };

  if (spelling) {
    normalized.spelling = spelling;
  }

  return normalized;
}

export function buildTemplatePack(pack) {
  const base = ensurePack(pack);
  const edo = Number(base?.system?.edo);
  const normalizedEdo = Number.isFinite(edo) ? Math.max(12, edo) : 12;

  const strings = Array.isArray(base?.tuning?.strings)
    ? base.tuning.strings.slice(0, STR_MAX)
    : [];

  const seededStrings = strings.length >= STR_MIN ? strings : TEMPLATE_STRINGS;
  const meta = isPlainObject(base?.meta) ? base.meta : {};

  const next = {
    name: base?.name?.trim?.() || "New tuning pack",
    system: { edo: normalizedEdo },
    tuning: { strings: seededStrings },
    meta,
  };

  const spelling = normalizeSpellingHint(base?.spelling);
  if (spelling) {
    next.spelling = spelling;
  }

  return next;
}

export function buildNoteOptionsForPack(pack) {
  const strings = Array.isArray(pack?.tuning?.strings)
    ? pack.tuning.strings
    : [];
  const edo = Number(pack?.system?.edo);
  const metaSystemId =
    typeof pack?.meta?.systemId === "string" ? pack.meta.systemId : null;
  const systemMatch = findSystemByEdo(TUNINGS, edo, metaSystemId);
  const system = systemMatch?.system ?? null;
  const useGermanNotation = isGermanicSpellingMarker(pack?.spelling);
  const noteNaming = useGermanNotation ? "german" : "english";
  const seen = new Set();
  const options = [];

  if (system && Number.isFinite(system.divisions) && system.divisions > 0) {
    for (let pc = 0; pc < system.divisions; pc += 1) {
      pushUnique(
        options,
        seen,
        renderNoteName(system.nameForPc(pc, "sharp"), noteNaming),
      );
      pushUnique(
        options,
        seen,
        renderNoteName(system.nameForPc(pc, "flat"), noteNaming),
      );
    }
  } else if (Number.isFinite(edo) && edo > 0) {
    for (let pc = 0; pc < edo; pc += 1) {
      pushUnique(options, seen, renderNoteName(nameFallback(pc), noteNaming));
    }
  }

  strings.forEach((entry) => {
    pushUnique(options, seen, entry?.note);
  });

  const systemLabel = getSystemLabel({
    match: systemMatch,
    edo,
    metaSystemId,
  });

  return { noteOptions: options, systemLabel };
}

export function togglePackSpelling(pack, defaultSpelling = "de-h/b") {
  const base = isPlainObject(pack) ? { ...pack } : {};
  const activeSpelling = normalizeSpellingHint(base.spelling);
  if (activeSpelling) {
    delete base.spelling;
    return base;
  }

  base.spelling = normalizeSpellingHint(defaultSpelling) || "de-h/b";
  return base;
}
