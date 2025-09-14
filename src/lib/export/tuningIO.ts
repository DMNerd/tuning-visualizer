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
  version: 2;
  name: string;
  system: { edo: number }; // accidentals removed
  tuning: { strings: TuningString[] };
  meta?: { stringMeta?: StringMeta[]; [k: string]: unknown };
};

export function buildTuningPack(params: {
  systemDivisions: number; // e.g. 24 for 24-TET
  systemId: string; // e.g. "24-TET"
  stringsCount: number; // UI strings count
  tuning: string[]; // note names exactly as shown in UI
  stringMeta?: StringMeta[]; // optional per-string metadata
  name?: string; // optional override
}): TuningPack {
  const { systemDivisions, systemId, stringsCount, tuning, stringMeta, name } =
    params;

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

  const pack: TuningPack = {
    version: 2,
    name: name ?? `${systemId} ${stringsCount}-string`,
    system: { edo: systemDivisions },
    tuning: { strings },
  };

  if (stringMeta && stringMeta.length) {
    pack.meta = { stringMeta };
  }

  return pack;
}

export function downloadTuningPack(pack: TuningPack, filename?: string) {
  const blob = new Blob([JSON.stringify(pack, null, 2)], {
    type: "application/json",
  });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `${filename || pack.name}.tuning.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
