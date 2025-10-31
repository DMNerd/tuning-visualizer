import * as v from "valibot";
import { STR_MAX, STR_MIN } from "@/lib/config/appDefaults";

export const TuningStringSchema = v.pipe(
  v.object({
    label: v.optional(v.string()),
    note: v.optional(v.string()),
    midi: v.optional(v.number()),
    startFret: v.optional(v.number()),
    greyBefore: v.optional(v.boolean()),
  }),
  v.check(
    (value) => typeof value.note === "string" || typeof value.midi === "number",
    "Each string must include a note or MIDI value.",
  ),
);

export const TuningPackSchema = v.object({
  name: v.string(),
  system: v.object({
    edo: v.pipe(
      v.number(),
      v.integer("System edo must be an integer value."),
      v.minValue(12, "System edo must be at least 12."),
    ),
  }),
  tuning: v.object({
    strings: v.pipe(
      v.array(TuningStringSchema),
      v.minLength(
        STR_MIN,
        `Tuning pack must include at least ${STR_MIN} strings.`,
      ),
      v.maxLength(
        STR_MAX,
        `Tuning pack may include at most ${STR_MAX} strings.`,
      ),
    ),
  }),
  meta: v.optional(v.record(v.string(), v.unknown())),
});

export const TuningPackArraySchema = v.array(TuningPackSchema);

export type TuningString = v.InferOutput<typeof TuningStringSchema>;
export type TuningPack = v.InferOutput<typeof TuningPackSchema>;
export type TuningPackArray = v.InferOutput<typeof TuningPackArraySchema>;

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
      "Pack is not a valid tuning.";
    throw new Error(message);
  }

  const normalizedName = res.output.name?.trim?.();
  if (!normalizedName) {
    throw new Error("Custom tuning must include a name.");
  }

  return {
    ...res.output,
    name: normalizedName,
  };
}
