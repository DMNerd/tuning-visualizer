import * as v from "valibot";
import { STR_MAX, STR_MIN } from "@shared/config/appDefaults";
import { normalizeSpellingHint } from "@domain/theory/notation";
import i18n from "@shared/i18n";

// Messages are functions so they are translated when validation runs
const msg = (key: string, options?: Record<string, unknown>) => () =>
  i18n.t(key, options);

export const TuningStringSchema = v.pipe(
  v.object({
    label: v.optional(v.string()),
    note: v.optional(v.string()),
    midi: v.optional(v.number()),
    startFret: v.optional(v.number()),
    greyBefore: v.optional(v.boolean()),
  }),
  v.check(
    (value) =>
      (typeof value.note === "string" && value.note.trim().length > 0) ||
      typeof value.midi === "number",
    msg("packs.stringNeedsNote"),
  ),
);

export const TuningPackSchema = v.object({
  name: v.string(),
  spelling: v.optional(v.string()),
  system: v.object({
    edo: v.pipe(
      v.number(),
      v.integer(msg("packs.edoInteger")),
      v.minValue(12, msg("packs.edoMin", { min: 12 })),
    ),
  }),
  tuning: v.object({
    strings: v.pipe(
      v.array(TuningStringSchema),
      v.minLength(STR_MIN, msg("packs.minStrings", { min: STR_MIN })),
      v.maxLength(STR_MAX, msg("packs.maxStrings", { max: STR_MAX })),
    ),
  }),
  meta: v.optional(v.record(v.string(), v.unknown())),
});

export const TuningPackArraySchema = v.array(TuningPackSchema);

export type TuningPack = v.InferOutput<typeof TuningPackSchema>;

export function stripVersionField(pack: unknown) {
  if (pack === null || typeof pack !== "object" || Array.isArray(pack)) {
    return pack;
  }

  if (!("version" in pack)) {
    return pack;
  }

  const { version: _ignored, ...rest } = pack as Record<string, unknown>;
  return rest;
}

export function parseTuningPack(pack: unknown): TuningPack {
  const sanitized = stripVersionField(pack);
  const res = v.safeParse(TuningPackSchema, sanitized);
  if (!res.success) {
    const message =
      res.issues?.map((issue) => issue.message).join("; ") ||
      i18n.t("packs.invalidTuning");
    throw new Error(message);
  }

  const normalizedName = res.output.name?.trim?.();
  if (!normalizedName) {
    throw new Error(i18n.t("packs.nameRequired"));
  }
  const normalizedSpelling = normalizeSpellingHint(res.output.spelling);
  const { spelling: _rawSpelling, ...rest } = res.output;

  return {
    ...rest,
    name: normalizedName,
    ...(normalizedSpelling ? { spelling: normalizedSpelling } : {}),
  };
}
