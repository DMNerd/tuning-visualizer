import { useCallback } from "react";
import { useLocalStorage } from "react-use";
import { ordinal } from "@/utils/ordinals";
import * as v from "valibot";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { toast } from "react-hot-toast";
import { parseTuningPack, TuningPackArraySchema } from "@/lib/export/schema";

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
    (tuning, stringMeta = null) => {
      const sys = TUNINGS[systemId];
      const stringsArr = tuning.map((n, i) => {
        const meta = stringMeta?.find((m) => m.index === i) || {};
        return {
          note: n,
          ...(typeof meta.startFret === "number"
            ? { startFret: meta.startFret }
            : {}),
          ...(typeof meta.greyBefore === "boolean"
            ? { greyBefore: meta.greyBefore }
            : {}),
        };
      });

      return {
        version: 2,
        name: `${systemId} ${strings}-string`,
        system: { edo: sys.divisions },
        tuning: { strings: stringsArr },
        meta: stringMeta ? { stringMeta } : {},
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
          res.issues?.map((i) => i.message).join("; ") ||
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
      return toast.promise(
        Promise.resolve().then(() => onImportTunings(json, filenames)),
        {
          loading: "Importing tunings…",
          success: "Tunings imported.",
          error: (e) => e?.message || "Import failed.",
        },
        { id: "import-tunings" },
      );
    },
    [onImportTunings],
  );

  const exportCurrent = useCallback(
    (tuning, stringMeta) => {
      return toast.promise(
        Promise.resolve().then(() => {
          const pack = getCurrentTuningPack(tuning, stringMeta);
          if (!pack)
            throw new Error("Nothing to export for the current tuning.");
          const blob = new Blob([JSON.stringify(pack, null, 2)], {
            type: "application/json",
          });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `current-tuning.json`;
          a.click();
          URL.revokeObjectURL(a.href);
        }),
        {
          loading: "Preparing current tuning…",
          success: "Current tuning exported.",
          error: (e) => e?.message || "Export failed.",
        },
        { id: "export-current-tuning" },
      );
    },
    [getCurrentTuningPack],
  );

  const exportAll = useCallback(() => {
    return toast.promise(
      Promise.resolve().then(() => {
        const packs = getAllCustomTunings() || [];
        if (!packs.length) throw new Error("No custom tunings to export.");
        const blob = new Blob([JSON.stringify(packs, null, 2)], {
          type: "application/json",
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `custom-tunings.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      }),
      {
        loading: "Collecting custom tunings…",
        success: "Custom tunings exported.",
        error: (e) => e?.message || "Export failed.",
      },
      { id: "export-all-tunings" },
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
