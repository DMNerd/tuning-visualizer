import { useCallback } from "react";
import { useLocalStorage } from "react-use";
import { ordinal } from "@/utils/ordinals";
import * as v from "valibot";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";

/* =========================
   Valibot Schemas
========================= */

const TuningStringSchema = v.object({
  label: v.optional(v.string()),
  note: v.optional(v.string()),
  midi: v.optional(v.number()),
  startFret: v.optional(v.number()),
  greyBefore: v.optional(v.boolean()),
});

const TuningPackSchema = v.object({
  version: v.literal(2),
  name: v.string(),
  system: v.object({
    edo: v.number(),
  }),
  tuning: v.object({
    strings: v.array(TuningStringSchema),
  }),
  meta: v.optional(v.record(v.unknown())),
});

const TuningPackArraySchema = v.array(TuningPackSchema);

/* =========================
   Hook
========================= */

export function useTuningIO({ systemId, strings, TUNINGS }) {
  // Persist array of custom packs directly
  const [customTunings, setCustomTunings] = useLocalStorage(
    STORAGE_KEYS.CUSTOM_TUNINGS,
    [],
  );

  // ----- Export current tuning as a pack -----
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

  // ----- Export all custom tunings -----
  const getAllCustomTunings = useCallback(
    () => customTunings || [],
    [customTunings],
  );

  // ----- Import one or more packs -----
  const onImportTunings = useCallback((packsRaw, filenames = []) => {
    let parsed;
    try {
      parsed = v.parse(TuningPackArraySchema, packsRaw);
    } catch (err) {
      console.error("Import failed:", err);
      return;
    }

    const newTunings = parsed.map((p, i) => {
      const label = p.name || filenames[i] || `Imported ${ordinal(i + 1)}`;
      const { system, ...rest } = p;
      const cleanSystem = { edo: system.edo };
      return { ...rest, system: cleanSystem, name: label };
    });

    setCustomTunings((prev) => [...(prev || []), ...newTunings]);
  }, [setCustomTunings]);

  return {
    getCurrentTuningPack,
    getAllCustomTunings,
    onImportTunings,
    customTunings: customTunings || [],
    clearCustomTunings: () => setCustomTunings([]),
  };
}
