import { useCallback } from "react";
import { useLocalStorage } from "react-use";
import { ordinal } from "@/utils/ordinals";
import * as v from "valibot";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { parseTuningPack, TuningPackArraySchema } from "@/lib/export/schema";
import { buildTuningPack, downloadJsonFile } from "@/lib/export/tuningIO";
import { withToastPromise } from "@/utils/toast";

/* =========================
   Hook
========================= */

export function useTuningIO({ systemId, strings, TUNINGS }) {
  // Persist array of custom packs directly
  const [customTunings, setCustomTunings] = useLocalStorage(
    STORAGE_KEYS.CUSTOM_TUNINGS,
    [],
  );

  const parsePack = useCallback(parseTuningPack, []);

  // ----- Export current tuning as a pack (pure) -----
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

  // ----- Export all custom tunings (pure) -----
  const getAllCustomTunings = useCallback(
    () => customTunings || [],
    [customTunings],
  );

  const saveCustomTuning = useCallback(
    (pack, options = {}) => {
      const parsed = parsePack(pack);
      const replaceName =
        typeof options?.replaceName === "string"
          ? options.replaceName
          : undefined;

      setCustomTunings((prev) => {
        const existing = Array.isArray(prev) ? prev : [];
        const filtered = existing.filter((item) => {
          if (!item || typeof item.name !== "string") return true;
          if (replaceName && item.name === replaceName) return false;
          return item.name !== parsed.name;
        });
        return [...filtered, parsed];
      });

      return parsed;
    },
    [parsePack, setCustomTunings],
  );

  const deleteCustomTuning = useCallback(
    (name) => {
      if (!name) return;
      setCustomTunings((prev) => {
        const existing = Array.isArray(prev) ? prev : [];
        const filtered = existing.filter((item) => item?.name !== name);
        return filtered;
      });
    },
    [setCustomTunings],
  );

  // ----- Import one or more packs (pure) -----
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

      const newTunings = parsed.map((p, i) => {
        const label = p.name || filenames[i] || `Imported ${ordinal(i + 1)}`;
        const { system, ...rest } = p;
        const cleanSystem = { edo: system.edo };
        return { ...rest, system: cleanSystem, name: label };
      });

      setCustomTunings((prev) => [...(prev || []), ...newTunings]);
    },
    [setCustomTunings],
  );

  /* =========================
     Toast-wrapped helpers
     (optional convenience)
  ========================= */

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
