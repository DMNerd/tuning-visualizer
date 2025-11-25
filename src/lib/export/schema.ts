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
  system: v.pipe(
    v.object({
      edo: v.pipe(
        v.number(),
        v.integer("System edo must be an integer value."),
        v.minValue(1, "System edo must be at least 1."),
      ),
      id: v.optional(v.string()),
      name: v.optional(v.string()),
      steps: v.optional(
        v.pipe(
          v.array(v.number()),
          v.minLength(1, "System steps must include at least one value."),
        ),
      ),
      ratios: v.optional(
        v.pipe(
          v.array(v.number()),
          v.minLength(1, "System ratios must include at least one value."),
        ),
      ),
      refFreq: v.optional(v.number()),
      refMidi: v.optional(v.number()),
    }),
    v.check(
      (value) => {
        const edo = Number(value.edo);
        if (!Number.isFinite(edo) || edo <= 0) return false;

        if (Array.isArray(value.steps) && value.steps.length !== edo) {
          return false;
        }
        if (Array.isArray(value.ratios) && value.ratios.length !== edo) {
          return false;
        }
        return true;
      },
      "System tables must include an entry for each division.",
    ),
  ),
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
    system: {
      ...res.output.system,
      ...(typeof res.output.system.id === "string"
        ? { id: res.output.system.id.trim() }
        : {}),
      ...(typeof res.output.system.name === "string"
        ? { name: res.output.system.name.trim() }
        : {}),
    },
  };
}
