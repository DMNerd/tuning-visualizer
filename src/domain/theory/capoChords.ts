import { mod } from "@shared/lib/math";

export function normalizeCapoFret(capoFret: unknown): number {
  return typeof capoFret === "number" && Number.isFinite(capoFret)
    ? Math.max(0, Math.floor(capoFret))
    : 0;
}

export function getEffectiveCapoPitchOffset(
  capoFret: unknown,
  divisions: number,
): number {
  if (!Number.isFinite(divisions) || divisions <= 0) return 0;

  return mod(normalizeCapoFret(capoFret), divisions);
}

export function transposePitchClassSet<T extends number>(
  pcs: Set<T> | null | undefined,
  amount: number,
  divisions: number,
): Set<number> | null | undefined {
  if (!(pcs instanceof Set)) return pcs;
  if (!Number.isFinite(amount) || amount === 0) return pcs;
  if (!Number.isFinite(divisions) || divisions <= 0) return pcs;

  return new Set(Array.from(pcs, (pc) => mod(pc + amount, divisions)));
}

export function resolveCapoRelativeChordRootPc({
  pc,
  capoFret = 0,
  chordCapoRelative = false,
  divisions,
}: {
  pc: number;
  capoFret?: number;
  chordCapoRelative?: boolean;
  divisions: number;
}): number {
  if (!Number.isFinite(pc)) return pc;
  if (!chordCapoRelative) return pc;
  if (!Number.isFinite(divisions) || divisions <= 0) return pc;

  return mod(pc - getEffectiveCapoPitchOffset(capoFret, divisions), divisions);
}

export function transposeCapoRelativeChordRootPc({
  pc,
  capoFret = 0,
  chordCapoRelative = false,
  divisions,
}: {
  pc: number;
  capoFret?: number;
  chordCapoRelative?: boolean;
  divisions: number;
}): number {
  if (!Number.isFinite(pc)) return pc;
  if (!chordCapoRelative) return pc;
  if (!Number.isFinite(divisions) || divisions <= 0) return pc;

  return mod(pc + getEffectiveCapoPitchOffset(capoFret, divisions), divisions);
}
