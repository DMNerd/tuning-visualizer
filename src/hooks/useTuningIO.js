import { useCallback, useEffect, useRef } from "react";
import { useLocalStorage, useLatest } from "react-use";
import { ordinal } from "@/utils/ordinals";
import * as v from "valibot";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import {
  parseTuningPack,
  stripVersionField,
  TuningPackArraySchema,
} from "@/lib/export/schema";
import { buildTuningPack, downloadJsonFile } from "@/lib/export/tuningIO";
import { withToastPromise } from "@/utils/toast";

function normalizePackName(value) {
  return typeof value === "string" ? value.trim() : "";
}

function ensureUniqueName(desiredName, takenNames) {
  const base = normalizePackName(desiredName);
  if (!base) return "";

  if (!takenNames.has(base)) {
    takenNames.add(base);
    return base;
  }

  let suffix = 2;
  let candidate = `${base} (${suffix})`;
  while (takenNames.has(candidate)) {
    suffix += 1;
    candidate = `${base} (${suffix})`;
  }

  takenNames.add(candidate);
  return candidate;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function flattenOnce(arr) {
  if (!Array.isArray(arr)) return arr;
  let nested = false;
  const flat = [];
  for (const entry of arr) {
    if (Array.isArray(entry)) {
      nested = true;
      flat.push(...entry);
    } else {
      flat.push(entry);
    }
  }
  return nested ? flat : arr;
}

const LEGACY_STRING_KEYS = [
  "strings",
  "tuning",
  "notes",
  "tokens",
  "pitches",
  "values",
];

function findLegacyStringSource(value) {
  if (Array.isArray(value)) {
    return flattenOnce(value);
  }

  if (!isPlainObject(value)) {
    return null;
  }

  const tuning = value.tuning;
  if (Array.isArray(tuning)) {
    return flattenOnce(tuning);
  }
  if (isPlainObject(tuning) && Array.isArray(tuning.strings)) {
    return flattenOnce(tuning.strings);
  }

  for (const key of LEGACY_STRING_KEYS) {
    const candidate = value[key];
    if (Array.isArray(candidate)) {
      return flattenOnce(candidate);
    }
  }

  for (const wrapper of ["data", "payload"]) {
    const nested = value[wrapper];
    if (!nested) continue;
    const resolved = findLegacyStringSource(nested);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function normalizeLegacyStringEntry(entry) {
  if (isPlainObject(entry)) {
    const normalized = {};
    if (typeof entry.label === "string") normalized.label = entry.label;
    if (typeof entry.note === "string" && entry.note.trim()) {
      normalized.note = entry.note.trim();
    } else if (typeof entry.token === "string" && entry.token.trim()) {
      normalized.note = entry.token.trim();
    } else if (typeof entry.pitch === "string" && entry.pitch.trim()) {
      normalized.note = entry.pitch.trim();
    } else if (typeof entry.value === "string" && entry.value.trim()) {
      normalized.note = entry.value.trim();
    }
    if (typeof entry.midi === "number" && Number.isFinite(entry.midi)) {
      normalized.midi = entry.midi;
    }
    if (
      typeof entry.startFret === "number" &&
      Number.isFinite(entry.startFret)
    ) {
      normalized.startFret = entry.startFret;
    }
    if (typeof entry.greyBefore === "boolean") {
      normalized.greyBefore = entry.greyBefore;
    }

    if (
      typeof normalized.note === "string" ||
      typeof normalized.midi === "number"
    ) {
      return normalized;
    }
  }

  if (typeof entry === "string") {
    const note = entry.trim();
    if (note) {
      return { note };
    }
  }

  if (typeof entry === "number" && Number.isFinite(entry)) {
    return { midi: entry };
  }

  return null;
}

function normalizeLegacyStrings(value) {
  const source = findLegacyStringSource(value);
  if (!Array.isArray(source) || !source.length) {
    return null;
  }

  const normalized = source
    .map(normalizeLegacyStringEntry)
    .filter(
      (entry) =>
        entry &&
        (typeof entry.note === "string" || typeof entry.midi === "number"),
    );

  if (!normalized.length) {
    return null;
  }

  return normalized;
}

function resolveLegacyEdo(pack) {
  const current = Number(pack?.system?.edo);
  if (Number.isFinite(current) && current > 0) {
    return Math.trunc(current);
  }

  const legacy = Number(pack?.edo);
  if (Number.isFinite(legacy) && legacy > 0) {
    return Math.trunc(legacy);
  }

  return null;
}

function upgradeLegacyPack(pack) {
  if (!isPlainObject(pack)) {
    return pack;
  }

  let changed = false;
  const next = { ...pack };

  if ("version" in next) {
    delete next.version;
    changed = true;
  }

  const existingStrings = Array.isArray(next?.tuning?.strings)
    ? next.tuning.strings
    : null;

  const needsStringUpgrade =
    !existingStrings || existingStrings.some((entry) => !isPlainObject(entry));

  if (needsStringUpgrade) {
    const normalized = normalizeLegacyStrings(
      existingStrings ? { strings: existingStrings } : next,
    );
    if (normalized) {
      next.tuning = { strings: normalized };
      changed = true;
    }
  }

  const edo = resolveLegacyEdo(next);
  if (Number.isFinite(edo) && edo > 0) {
    if (!isPlainObject(next.system) || next.system.edo !== edo) {
      next.system = { edo };
      changed = true;
    }
  }

  return changed ? next : pack;
}

/* =========================
   Hook
========================= */

export function useTuningIO({ systemId, strings, TUNINGS }) {
  const [customTunings, setCustomTunings] = useLocalStorage(
    STORAGE_KEYS.CUSTOM_TUNINGS,
    [],
  );
  const upgradeRef = useRef(false);

  useEffect(() => {
    if (upgradeRef.current) return;

    if (!Array.isArray(customTunings) || !customTunings.length) {
      upgradeRef.current = true;
      return;
    }

    let changed = false;
    const upgraded = customTunings.map((pack) => {
      const next = upgradeLegacyPack(pack);
      if (next !== pack) {
        changed = true;
      }
      return next;
    });

    upgradeRef.current = true;
    if (changed) {
      setCustomTunings(upgraded);
    }
  }, [customTunings, setCustomTunings]);

  const latestCustomTuningsRef = useLatest(customTunings);

  const getExistingCustomTunings = useCallback(() => {
    const existing = latestCustomTuningsRef.current;
    return Array.isArray(existing) ? existing : [];
  }, [latestCustomTuningsRef]);

  const parsePack = useCallback(parseTuningPack, []);

  const getCurrentTuningPack = useCallback(
    (tuning, stringMeta = null, boardMeta = null) => {
      const sys = TUNINGS[systemId];
      const cleanStringMeta = Array.isArray(stringMeta) ? stringMeta : null;
      const cleanBoardMeta =
        boardMeta && typeof boardMeta === "object" && !Array.isArray(boardMeta)
          ? boardMeta
          : null;

      const pack = buildTuningPack({
        systemDivisions: sys.divisions,
        systemId,
        stringsCount: strings,
        tuning,
        stringMeta: cleanStringMeta ?? undefined,
      });

      const meta = { ...(pack.meta || {}) };
      if (cleanStringMeta && cleanStringMeta.length) {
        meta.stringMeta = cleanStringMeta;
      }
      if (cleanBoardMeta && Object.keys(cleanBoardMeta).length) {
        meta.board = { ...cleanBoardMeta };
      }

      const hasMeta = Object.keys(meta).length > 0;

      return {
        ...pack,
        ...(hasMeta ? { meta } : { meta: undefined }),
      };
    },
    [systemId, strings, TUNINGS],
  );

  const getAllCustomTunings = useCallback(() => {
    const existing = getExistingCustomTunings();
    return existing;
  }, [getExistingCustomTunings]);

  const saveCustomTuning = useCallback(
    (pack, options = {}) => {
      const parsed = parsePack(pack);

      const desiredName = normalizePackName(parsed?.name);
      const replaceName = normalizePackName(options?.replaceName);

      let savedPack = null;

      const existing = getExistingCustomTunings();
      const takenNames = new Set(
        existing
          .map((item) => normalizePackName(item?.name))
          .filter((name) => name && name !== replaceName),
      );

      const finalName = ensureUniqueName(desiredName, takenNames);
      const nextPack = { ...parsed, name: finalName };
      savedPack = nextPack;

      const filtered = existing.filter((item) => {
        const itemName = normalizePackName(item?.name);
        if (replaceName && itemName === replaceName) return false;
        return itemName !== finalName;
      });

      const nextTunings = [...filtered, nextPack];
      setCustomTunings(nextTunings);

      return savedPack ?? { ...parsed, name: desiredName };
    },
    [getExistingCustomTunings, parsePack, setCustomTunings],
  );

  const deleteCustomTuning = useCallback(
    (name) => {
      const target = typeof name === "string" ? name.trim() : name;
      if (!target) return;
      const existing = getExistingCustomTunings();
      const filtered = existing.filter((item) => {
        const itemName = typeof item?.name === "string" ? item.name.trim() : "";
        return itemName !== target;
      });
      setCustomTunings(filtered);
    },
    [getExistingCustomTunings, setCustomTunings],
  );

  const onImportTunings = useCallback(
    (packsRaw, filenames = []) => {
      const sanitizedInput = Array.isArray(packsRaw)
        ? packsRaw.map(stripVersionField)
        : packsRaw;

      const res = v.safeParse(TuningPackArraySchema, sanitizedInput);
      if (!res.success) {
        const msg =
          res.issues?.map((i) => i.message).join("\n") ||
          "Selected file is not a valid tuning pack.";
        throw new Error(msg);
      }

      const parsed = res.output;

      const existing = getExistingCustomTunings();
      const takenNames = new Set(
        existing.map((item) => normalizePackName(item?.name)).filter(Boolean),
      );

      const newTunings = parsed.map((p, i) => {
        const candidate =
          (typeof p.name === "string" ? p.name : "") ||
          (typeof filenames[i] === "string" ? filenames[i] : "") ||
          `Imported ${ordinal(i + 1)}`;
        const label = candidate.trim() || `Imported ${ordinal(i + 1)}`;
        const uniqueName = ensureUniqueName(label, takenNames);
        const { system, ...rest } = p;
        const cleanSystem = { edo: system.edo };
        return { ...rest, system: cleanSystem, name: uniqueName };
      });

      const nextTunings = [...existing, ...newTunings];
      setCustomTunings(nextTunings);
    },
    [getExistingCustomTunings, setCustomTunings],
  );

  const importFromJson = useCallback(
    async (json, filenames = []) => {
      return withToastPromise(
        () => onImportTunings(json, filenames),
        {
          loading: "Importing tunings…",
          success: "Tunings imported.",
          error: (e) => e?.message || "Import failed.",
        },
        "import-tunings",
      );
    },
    [onImportTunings],
  );

  const exportCurrent = useCallback(
    (tuning, stringMeta, boardMeta) => {
      return withToastPromise(
        () => {
          const pack = getCurrentTuningPack(tuning, stringMeta, boardMeta);
          if (!pack)
            throw new Error("Nothing to export for the current tuning.");
          downloadJsonFile(pack, "current-tuning.json");
        },
        {
          loading: "Preparing current tuning…",
          success: "Current tuning exported.",
          error: (e) => e?.message || "Export failed.",
        },
        "export-current-tuning",
      );
    },
    [getCurrentTuningPack],
  );

  const exportAll = useCallback(() => {
    return withToastPromise(
      () => {
        const packs = getAllCustomTunings() || [];
        if (!packs.length) throw new Error("No custom tunings to export.");
        downloadJsonFile(packs, "custom-tunings.json");
      },
      {
        loading: "Collecting custom tunings…",
        success: "Custom tunings exported.",
        error: (e) => e?.message || "Export failed.",
      },
      "export-all-tunings",
    );
  }, [getAllCustomTunings]);

  return {
    getCurrentTuningPack,
    getAllCustomTunings,
    saveCustomTuning,
    deleteCustomTuning,
    onImportTunings,
    customTunings: customTunings || [],
    clearCustomTunings: () => setCustomTunings([]),
    importFromJson,
    exportCurrent,
    exportAll,
  };
}
