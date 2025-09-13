import { useState, useCallback } from "react";
import { ordinal } from "@/utils/ordinals";
import * as v from "valibot";

/* =========================
   Valibot Schemas
========================= */

const TuningString = v.pipe(
  v.object({
    label: v.optional(v.string()),
    note: v.optional(v.string()),
    midi: v.optional(v.number()),
    startFret: v.optional(v.number()),
    greyBefore: v.optional(v.boolean()),
  }),
  v.check(
    (s) => typeof s.note === "string" || typeof s.midi === "number",
    "Each string must include either 'note' or 'midi'.",
  ),
);

const System = v.object({
  edo: v.number(),
});

const TuningPackSchema = v.object({
  version: v.optional(v.any()),
  name: v.string(),
  system: System,
  tuning: v.object({
    strings: v.array(TuningString, [
      v.minLength(1, "At least one string required"),
    ]),
  }),
  meta: v.optional(v.any()),
});

/* =========================
   Helper fns (names unchanged)
========================= */

function makeTuningPack({ name, edo, strings, meta }) {
  return {
    version: 2,
    name,
    system: { edo },
    tuning: { strings },
    meta: meta ?? {},
  };
}

function parseTuningPack(json) {
  const pack = v.parse(TuningPackSchema, json);

  const strings = pack.tuning.strings.map((s) => {
    const out = {};
    if (typeof s.label === "string") out.label = s.label;
    if (typeof s.note === "string") out.note = s.note;
    if (typeof s.midi === "number") out.midi = s.midi;
    if (typeof s.startFret === "number") out.startFret = s.startFret;
    if (typeof s.greyBefore === "boolean") out.greyBefore = s.greyBefore;
    return out;
  });

  return {
    ...(pack.version != null ? { version: pack.version } : {}),
    name: pack.name,
    system: { edo: pack.system.edo },
    tuning: { strings },
    meta: typeof pack.meta === "object" && pack.meta ? pack.meta : {},
  };
}

/* =========================
   Hook
========================= */

/**
 * useTuningIO — tuning-focused I/O (no display prefs)
 * Provides: getCurrentTuningPack, getAllCustomTunings, onImportTunings
 */
export function useTuningIO({
  // read
  systemId,
  system,
  strings,
  frets,
  tuning,
  stringMeta,

  // write
  setSystemId,
  setStrings,
  setFrets,
  setTuning,
  setStringMeta,
  setSelectedPreset,

  // helpers
  TUNINGS,
}) {
  const [customTunings, setCustomTunings] = useState([]);

  const getCurrentTuningPack = useCallback(() => {
    const stringsPack = tuning.map((note, idx) => {
      const metaForIdx =
        Array.isArray(stringMeta) &&
        stringMeta.find((m) => Number(m.index) === idx);
      return {
        label: ordinal(strings - idx),
        note,
        ...(metaForIdx && typeof metaForIdx.startFret === "number"
          ? { startFret: metaForIdx.startFret }
          : {}),
        ...(metaForIdx && metaForIdx.greyBefore ? { greyBefore: true } : {}),
      };
    });

    return makeTuningPack({
      name: `Custom (${systemId}, ${strings} strings)`,
      edo: system.divisions,
      strings: stringsPack,
      meta: {
        systemId,
        strings,
        frets,
        createdAt: new Date().toISOString(),
        ...(Array.isArray(stringMeta) ? { stringMeta } : {}),
      },
    });
  }, [tuning, stringMeta, strings, systemId, system.divisions, frets]);

  const getAllCustomTunings = useCallback(() => customTunings, [customTunings]);

  const findSystemIdByEdo = useCallback(
    (edo) => {
      for (const id of Object.keys(TUNINGS)) {
        if (TUNINGS[id]?.divisions === edo) return id;
      }
      return null;
    },
    [TUNINGS],
  );

  const onImportTunings = useCallback(
    (packsRaw, filenames = []) => {
      if (!Array.isArray(packsRaw) || packsRaw.length === 0) return;

      // Parse + apply filename as display name (if provided)
      const packs = packsRaw.map((p, i) => {
        const parsed = parseTuningPack(p);

        // If a filename is provided, use its basename (strip extension) as the UI name.
        const fname = typeof filenames[i] === "string" ? filenames[i] : null;
        if (fname) {
          const base = fname.replace(/\.[^/.]+$/, ""); // remove final .ext
          parsed.name = base;
        }

        return parsed;
      });

      // Merge into customTunings (dedupe by name+edo)
      setCustomTunings((prev) => {
        const key = (p) => `${p.name}::${p.system?.edo ?? "?"}`;
        const map = new Map(prev.map((p) => [key(p), p]));
        packs.forEach((p) => map.set(key(p), p));
        return Array.from(map.values());
      });

      // Apply the last imported pack to the UI
      const last = packs[packs.length - 1];
      if (!last) return;

      // Switch system by EDO if we can find a known system id
      const targetSystem = findSystemIdByEdo(last.system?.edo) ?? systemId;
      setSystemId(targetSystem);

      // Apply tuning notes
      const nextTuning = Array.isArray(last.tuning?.strings)
        ? last.tuning.strings.map((s) =>
            typeof s?.note === "string" ? s.note : "C",
          )
        : tuning;
      setTuning(nextTuning);

      // Build/merge per-string meta (from strings + meta.stringMeta)
      const fromStrings = Array.isArray(last.tuning?.strings)
        ? last.tuning.strings
            .map((s, idx) => {
              const meta = {};
              if (typeof s?.startFret === "number")
                meta.startFret = s.startFret;
              if (typeof s?.greyBefore === "boolean")
                meta.greyBefore = s.greyBefore;
              return Object.keys(meta).length ? { index: idx, ...meta } : null;
            })
            .filter(Boolean)
        : null;

      const fromMeta = Array.isArray(last.meta?.stringMeta)
        ? last.meta.stringMeta
            .map((m) =>
              m && typeof m.index === "number"
                ? {
                    index: m.index,
                    ...(typeof m.startFret === "number"
                      ? { startFret: m.startFret }
                      : {}),
                    ...(typeof m.greyBefore === "boolean"
                      ? { greyBefore: m.greyBefore }
                      : {}),
                  }
                : null,
            )
            .filter(Boolean)
        : [];

      if (fromStrings?.length || fromMeta.length) {
        const byIx = new Map(fromStrings?.map((m) => [m.index, m]) || []);
        for (const m of fromMeta) {
          const prev = byIx.get(m.index) || { index: m.index };
          byIx.set(m.index, { ...m, ...prev });
        }
        setStringMeta(Array.from(byIx.values()));
      } else {
        setStringMeta(null);
      }

      // Optional extras from pack meta
      if (typeof last.meta?.strings === "number") setStrings(last.meta.strings);
      if (typeof last.meta?.frets === "number") setFrets(last.meta.frets);

      // Select the imported preset by the (possibly filename-based) name
      setSelectedPreset(last.name || "Imported");
    },
    [
      setCustomTunings,
      findSystemIdByEdo,
      systemId,
      setSystemId,
      setTuning,
      setStringMeta,
      setStrings,
      setFrets,
      setSelectedPreset,
      tuning,
    ],
  );

  return {
    getCurrentTuningPack,
    getAllCustomTunings,
    onImportTunings,
    customTunings,
  };
}
