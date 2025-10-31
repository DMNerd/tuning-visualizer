import { useCallback } from "react";
import { useLocalStorage, useLatest } from "react-use";
import { ordinal } from "@/utils/ordinals";
import * as v from "valibot";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { parseTuningPack, TuningPackArraySchema } from "@/lib/export/schema";
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

/* =========================
   Hook
========================= */

export function useTuningIO({ systemId, strings, TUNINGS }) {
  const [customTunings, setCustomTunings] = useLocalStorage(
    STORAGE_KEYS.CUSTOM_TUNINGS,
    [],
  );

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
      const res = v.safeParse(TuningPackArraySchema, packsRaw);
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
