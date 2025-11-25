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

import { isPlainObject } from "@/utils/object";

export interface PackMeta {
  id?: string | null;
  // allow arbitrary metadata fields
  [key: string]: unknown;
}

export interface Pack {
  name?: string | null;
  meta?: PackMeta | null;
  // allow arbitrary extra fields
  [key: string]: unknown;
}

interface Identifier {
  id: string | null;
  name: string | null;
  ref: Pack | null;
}

export function normalizePackName(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function generatePackId(): string {
  if (typeof crypto?.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const now = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `pack-${now}-${rand}`;
}

export function ensurePackHasId<T extends { meta?: PackMeta }>(pack: T): T {
  if (!isPlainObject(pack)) return pack;

  const obj = pack as Pack;

  const existingId =
    typeof obj?.meta?.id === "string" ? obj.meta.id.trim() : "";
  if (existingId) return pack;

  const meta: PackMeta = isPlainObject(obj.meta) ? { ...obj.meta } : {};
  meta.id = generatePackId();

  return { ...(obj as object), meta } as T;
}

function normalizeIdentifier(value: unknown): Identifier {
  if (typeof value === "string") {
    const name = value.trim();
    return {
      id: null,
      name: name || null,
      ref: null,
    };
  }

  if (isPlainObject(value)) {
    const pack = value as Pack;
    const id = typeof pack?.meta?.id === "string" ? pack.meta.id.trim() : "";
    const name = normalizePackName(pack?.name);
    return {
      id: id || null,
      name: name || null,
      ref: pack,
    };
  }

  return { id: null, name: null, ref: null };
}

function shouldDeletePack(candidate: Pack, identifier?: Identifier): boolean {
  if (!identifier) return false;

  const targetId = identifier.id;
  const targetName = identifier.name;
  const targetRef = identifier.ref;

  const candidateId =
    typeof candidate?.meta?.id === "string" ? candidate.meta.id.trim() : "";
  if (targetId && candidateId && candidateId === targetId) return true;

  if (targetRef && candidate === targetRef) return true;

  if (targetName) {
    const candidateName = normalizePackName(candidate?.name);
    if (candidateName && candidateName === targetName) return true;
  }

  return false;
}

export function removePackByIdentifier(
  packs: unknown,
  identifier: unknown,
): Pack[] {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!Array.isArray(packs) || packs.length === 0) return [];

  return (packs as Pack[]).filter(
    (pack) => !shouldDeletePack(pack, normalizedIdentifier),
  );
}
