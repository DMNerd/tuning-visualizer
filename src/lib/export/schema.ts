import * as v from "valibot";

export const TuningStringSchema = v.object({
  label: v.optional(v.string()),
  note: v.optional(v.string()),
  midi: v.optional(v.number()),
  startFret: v.optional(v.number()),
  greyBefore: v.optional(v.boolean()),
});

export const TuningPackSchema = v.object({
  version: v.literal(2),
  name: v.string(),
  system: v.object({
    edo: v.pipe(
      v.number(),
      v.integer("System edo must be an integer value."),
      v.minValue(1, "System edo must be at least 1."),
    ),
  }),
  tuning: v.object({
    strings: v.array(TuningStringSchema),
  }),
  meta: v.optional(v.record(v.string(), v.unknown())),
});

export const TuningPackArraySchema = v.array(TuningPackSchema);

export type TuningString = v.InferOutput<typeof TuningStringSchema>;
export type TuningPack = v.InferOutput<typeof TuningPackSchema>;
export type TuningPackArray = v.InferOutput<typeof TuningPackArraySchema>;

export function parseTuningPack(pack: unknown): TuningPack {
  const res = v.safeParse(TuningPackSchema, pack);
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
