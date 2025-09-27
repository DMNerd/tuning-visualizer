import { useCallback, useEffect } from "react";
import { useImmer } from "use-immer";
import { useDebounce } from "use-debounce";
import { ordinal } from "@/utils/ordinals";
import * as v from "valibot";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { safeJSONParse, safeJSONStringify } from "@/lib/storage/json";

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
  const [customTunings, setCustomTunings] = useImmer([]);
  const [debouncedCustomTunings] = useDebounce(customTunings, 300);

  // Load from storage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEYS.CUSTOM_TUNINGS);
    const arr = safeJSONParse(raw, []);
    if (Array.isArray(arr) && arr.length) {
      // replace whole array (immer setter supports direct value)
      setCustomTunings(arr);
    }
  }, [setCustomTunings]);

  // Debounced save
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.CUSTOM_TUNINGS,
        safeJSONStringify(debouncedCustomTunings, "[]"),
      );
    } catch {
      // ignore quota/serialization errors
    }
  }, [debouncedCustomTunings]);

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
  const getAllCustomTunings = useCallback(() => customTunings, [customTunings]);

  // ----- Import one or more packs -----
  const onImportTunings = useCallback(
    (packsRaw, filenames = []) => {
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

      setCustomTunings((draft) => {
        draft.push(...newTunings);
      });
    },
    [setCustomTunings],
  );

  return {
    getCurrentTuningPack,
    getAllCustomTunings,
    onImportTunings,
    customTunings,
    clearCustomTunings: () =>
      setCustomTunings((d) => {
        d.length = 0;
      }),
  };
}
