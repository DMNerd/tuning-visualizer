export type TuningString = {
  label?: string;
  note?: string;
  midi?: number;
  startFret?: number;
};

export type TuningPack = {
  version: 2;
  name: string;
  system: { edo: number; accidentals?: "sharp" | "flat" | "auto" };
  tuning: { strings: TuningString[] };
  meta?: Record<string, unknown>;
};

export function makeTuningPack(input: {
  name: string;
  edo: number;
  accidentals?: "sharp" | "flat" | "auto";
  strings: TuningString[];
  meta?: Record<string, unknown>;
}): TuningPack {
  return {
    version: 2,
    name: input.name,
    system: { edo: input.edo, accidentals: input.accidentals ?? "auto" },
    tuning: { strings: input.strings },
    meta: input.meta ?? {},
  };
}

export function parseTuningPack(json: unknown): TuningPack {
  if (!json || typeof json !== "object") {
    throw new Error("Invalid file: not an object.");
  }
  const o = json as Record<string, any>;

  // v2 only
  if (o.version !== 2) {
    throw new Error("Unsupported tuning file version; expected version: 2.");
  }
  if (typeof o.name !== "string" || !o.name.trim()) {
    throw new Error("Missing or invalid 'name'.");
  }
  if (!o.system || typeof o.system.edo !== "number" || o.system.edo <= 0) {
    throw new Error("Missing or invalid 'system.edo'.");
  }
  if (
    !o.tuning ||
    !Array.isArray(o.tuning.strings) ||
    o.tuning.strings.length < 1
  ) {
    throw new Error("Missing or empty 'tuning.strings'.");
  }

  const strings: TuningString[] = o.tuning.strings.map((s: any, i: number) => {
    const out: TuningString = {};
    if (s && typeof s === "object") {
      if (typeof s.label === "string") out.label = s.label;
      if (typeof s.note === "string") out.note = s.note;
      if (typeof s.midi === "number") out.midi = s.midi;
      if (typeof s.startFret === "number") out.startFret = s.startFret;
    }
    if (out.midi == null && !out.note) {
      throw new Error(`String #${i + 1} must include 'midi' or 'note'.`);
    }
    return out;
  });

  const accidentals =
    o.system.accidentals === "sharp" ||
    o.system.accidentals === "flat" ||
    o.system.accidentals === "auto"
      ? o.system.accidentals
      : "auto";

  return {
    version: 2,
    name: o.name,
    system: { edo: o.system.edo, accidentals },
    tuning: { strings },
    meta: typeof o.meta === "object" && o.meta ? o.meta : {},
  };
}
