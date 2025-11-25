export type TuningString = {
  label?: string;
  note?: string;
  midi?: number;
  startFret?: number;
  greyBefore?: boolean;
};

export type StringMeta = {
  index: number;
  startFret?: number;
  greyBefore?: boolean;
};

export type TuningPack = {
  name: string;
  system: {
    edo: number;
    id?: string;
    name?: string;
    steps?: number[];
    ratios?: number[];
    refFreq?: number;
    refMidi?: number;
  }; // accidentals removed
  tuning: { strings: TuningString[] };
  meta?: { stringMeta?: StringMeta[]; systemId?: string; [k: string]: unknown };
};

export function downloadJsonFile(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const href = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = filename;

    const body = document.body;
    if (body) body.appendChild(anchor);

    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(href);
  }
}

export function buildTuningPack(params: {
  systemDivisions: number; // e.g. 24 for 24-TET
  systemId: string; // e.g. "24-TET"
  systemName?: string; // human-friendly label
  stepCents?: number[]; // optional cents table
  stepRatios?: number[]; // optional ratio table
  refFreq?: number;
  refMidi?: number;
  stringsCount: number; // UI strings count
  tuning: string[]; // note names exactly as shown in UI
  stringMeta?: StringMeta[]; // optional per-string metadata
  name?: string; // optional override
}): TuningPack {
  const {
    systemDivisions,
    systemId,
    systemName,
    stepCents,
    stepRatios,
    refFreq,
    refMidi,
    stringsCount,
    tuning,
    stringMeta,
    name,
  } = params;

  const strings: TuningString[] = (tuning ?? []).map((n, i) => {
    const m = stringMeta?.find((x) => x.index === i);
    return {
      note: n,
      ...(typeof m?.startFret === "number" ? { startFret: m.startFret } : {}),
      ...(typeof m?.greyBefore === "boolean"
        ? { greyBefore: m.greyBefore }
        : {}),
    };
  });

  const system: TuningPack["system"] = { edo: systemDivisions };

  if (systemId) system.id = systemId;
  if (systemName) system.name = systemName;
  if (Array.isArray(stepCents) && stepCents.length === systemDivisions) {
    system.steps = stepCents;
  }
  if (Array.isArray(stepRatios) && stepRatios.length === systemDivisions) {
    system.ratios = stepRatios;
  }
  if (Number.isFinite(refFreq)) {
    system.refFreq = refFreq;
  }
  if (Number.isFinite(refMidi)) {
    system.refMidi = refMidi;
  }

  const pack: TuningPack = {
    name: name ?? `${systemId} ${stringsCount}-string`,
    system,
    tuning: { strings },
  };

  const meta: Record<string, unknown> = {};
  if (stringMeta && stringMeta.length) {
    meta.stringMeta = stringMeta;
  }
  if (systemId) {
    meta.systemId = systemId;
  }

  if (Object.keys(meta).length) {
    pack.meta = meta;
  }

  return pack;
}

export function downloadTuningPack(pack: TuningPack, filename?: string) {
  downloadJsonFile(pack, `${filename || pack.name}.tuning.json`);
}
