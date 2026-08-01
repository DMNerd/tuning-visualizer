import { TUNINGS } from "@domain/theory/tuning";
import { STR_MAX, STR_MIN, STR_FACTORY } from "@shared/config/appDefaults";
import { clamp } from "@shared/lib/math";
import { encodeBase64Url, decodeBase64Url } from "@shared/lib/base64url";
import { stableStringify } from "@shared/lib/stableStringify";
import { ROUTINE_SCHEMA_VERSION } from "@features/training/model/routineSchema";
import {
  ROUTINE_BEATS_DEFAULT,
  ROUTINE_BEATS_MAX,
  ROUTINE_BEATS_MIN,
  ROUTINE_BPM_DEFAULT,
  ROUTINE_BPM_MAX,
  ROUTINE_BPM_MIN,
} from "@features/training/model/routineLimits";
import {
  ROUTINE_TIME_SIGNATURE_DEFAULT,
  isRoutineTimeSignature,
} from "@features/training/model/routineTimeSignatures";
import {
  generateRoutineId,
  type Routine,
  type RoutineScaleBlock,
  type RoutineStartBlock,
} from "@features/training/model/routine";

type EncodedEnvelope = { v: number; r: Routine };

export function encodeRoutine(routine: Routine): string {
  const envelope: EncodedEnvelope = { v: ROUTINE_SCHEMA_VERSION, r: routine };
  return encodeBase64Url(stableStringify(envelope));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function coerceFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function coerceClampedInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(numeric)) return fallback;
  return clamp(Math.round(numeric), min, max);
}

function coerceStartBlock(raw: unknown): RoutineStartBlock | null {
  if (!isPlainObject(raw)) return null;
  const systemId = coerceString(raw.systemId);
  if (!systemId || !(systemId in TUNINGS)) return null;

  return {
    systemId,
    strings: coerceClampedInt(raw.strings, STR_MIN, STR_MAX, STR_FACTORY),
    presetName: coerceString(raw.presetName, ""),
    beats: coerceClampedInt(
      raw.beats,
      ROUTINE_BEATS_MIN,
      ROUTINE_BEATS_MAX,
      ROUTINE_BEATS_DEFAULT,
    ),
  };
}

function coerceScaleBlock(
  raw: unknown,
  divisions: number,
  seenIds: Set<string>,
): RoutineScaleBlock | null {
  if (!isPlainObject(raw)) return null;

  let id = coerceString(raw.id);
  if (!id || seenIds.has(id)) id = generateRoutineId();
  seenIds.add(id);

  const timeSig = isRoutineTimeSignature(raw.timeSig)
    ? raw.timeSig
    : ROUTINE_TIME_SIGNATURE_DEFAULT;

  return {
    id,
    scaleLabel: coerceString(raw.scaleLabel, ""),
    rootPc: coerceClampedInt(raw.rootPc, 0, Math.max(0, divisions - 1), 0),
    beats: coerceClampedInt(
      raw.beats,
      ROUTINE_BEATS_MIN,
      ROUTINE_BEATS_MAX,
      ROUTINE_BEATS_DEFAULT,
    ),
    bpm: coerceClampedInt(
      raw.bpm,
      ROUTINE_BPM_MIN,
      ROUTINE_BPM_MAX,
      ROUTINE_BPM_DEFAULT,
    ),
    timeSig,
  };
}

/**
 * Decodes an untrusted URL-supplied token back into a Routine. Never throws.
 * Only an unrecognized top-level shape or an unknown tuning system fail the
 * whole decode (returns null) — every other field is clamped/defaulted in
 * place so a partially-tampered link still recovers a usable routine.
 */
export function decodeRoutine(token: string): Routine | null {
  const json = decodeBase64Url(token);
  if (!json) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (!isPlainObject(parsed) || !isPlainObject(parsed.r)) return null;
  const record = parsed.r;

  const startBlock = coerceStartBlock(record.startBlock);
  if (!startBlock) return null;

  const divisions = TUNINGS[startBlock.systemId]?.divisions ?? 12;
  const seenIds = new Set<string>();
  const stepsRaw = record.steps;
  const steps = Array.isArray(stepsRaw)
    ? stepsRaw
        .map((step) => coerceScaleBlock(step, divisions, seenIds))
        .filter((step): step is RoutineScaleBlock => step !== null)
    : [];

  const now = Date.now();

  return {
    id: coerceString(record.id) || generateRoutineId(),
    name: coerceString(record.name, ""),
    createdAt: coerceFiniteNumber(record.createdAt, now),
    updatedAt: coerceFiniteNumber(record.updatedAt, now),
    startBlock,
    steps,
  };
}
