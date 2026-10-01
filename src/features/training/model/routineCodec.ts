import { TUNINGS } from "@domain/theory/tuning";
import { migrateScaleLabel } from "@domain/theory/scales";
import { STR_MAX, STR_MIN, STR_FACTORY } from "@shared/config/appDefaults";
import { clampInteger } from "@shared/lib/math";
import {
  decodeBase64UrlBytes,
  encodeBase64UrlBytes,
} from "@shared/lib/base64url";
import { ByteReader, ByteWriter } from "@shared/lib/byteStream";
import { ROUTINE_LINK_FORMAT } from "@features/training/model/routineSchema";
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

// Version 1 links were base64url JSON (`{"r":…,"v":1}`), so their first
// byte is "{"; binary links start with ROUTINE_LINK_FORMAT instead.
const JSON_LINK_FIRST_BYTE = 0x7b;

type StepField = Exclude<keyof RoutineScaleBlock, "id">;

// Mask bit order for a block's changed fields; never reorder.
const STEP_FIELDS: StepField[] = [
  "scaleLabel",
  "rootPc",
  "beats",
  "bpm",
  "timeSig",
];
const STRING_STEP_FIELDS = new Set<StepField>(["scaleLabel", "timeSig"]);

// What the first block is diffed against.
const STEP_BASELINE: Omit<RoutineScaleBlock, "id"> = {
  scaleLabel: "",
  rootPc: 0,
  beats: ROUTINE_BEATS_DEFAULT,
  bpm: ROUTINE_BPM_DEFAULT,
  timeSig: ROUTINE_TIME_SIGNATURE_DEFAULT,
};

/**
 * Binary link layout (all numbers are varints):
 *   format byte, string table (count, then each string),
 *   name, systemId, strings, presetName, start beats,
 *   block count, then per block a mask of the fields that differ from the
 *   previous block followed by just those values.
 * Text fields are string-table indexes, so a scale used by many blocks is
 * spelled out once. Ids and timestamps are not shared; decoding makes new
 * ones.
 */
export function encodeRoutine(routine: Routine): string {
  const table: string[] = [];
  const ref = (value: string) => {
    const index = table.indexOf(value);
    if (index >= 0) return index;
    table.push(value);
    return table.length - 1;
  };

  const body = new ByteWriter()
    .varint(ref(routine.name))
    .varint(ref(routine.startBlock.systemId))
    .varint(routine.startBlock.strings)
    .varint(ref(routine.startBlock.presetName))
    .varint(routine.startBlock.beats)
    .varint(routine.steps.length);

  let previous = STEP_BASELINE;
  for (const step of routine.steps) {
    const changed = STEP_FIELDS.filter(
      (field) => step[field] !== previous[field],
    );
    body.u8(
      changed.reduce(
        (mask, field) => mask | (1 << STEP_FIELDS.indexOf(field)),
        0,
      ),
    );
    for (const field of changed) {
      body.varint(
        STRING_STEP_FIELDS.has(field)
          ? ref(step[field] as string)
          : (step[field] as number),
      );
    }
    previous = step;
  }

  const header = new ByteWriter().u8(ROUTINE_LINK_FORMAT).varint(table.length);
  table.forEach((value) => header.string(value));

  const head = header.toBytes();
  const tail = body.toBytes();
  const bytes = new Uint8Array(head.length + tail.length);
  bytes.set(head);
  bytes.set(tail, head.length);
  return encodeBase64UrlBytes(bytes);
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

function coerceStartBlock(raw: unknown): RoutineStartBlock | null {
  if (!isPlainObject(raw)) return null;
  const systemId = coerceString(raw.systemId);
  if (!systemId || !(systemId in TUNINGS)) return null;

  return {
    systemId,
    strings: clampInteger(raw.strings, STR_MIN, STR_MAX, STR_FACTORY),
    presetName: coerceString(raw.presetName, ""),
    beats: clampInteger(
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
    scaleLabel: migrateScaleLabel(coerceString(raw.scaleLabel, "")),
    rootPc: clampInteger(raw.rootPc, 0, Math.max(0, divisions - 1), 0),
    beats: clampInteger(
      raw.beats,
      ROUTINE_BEATS_MIN,
      ROUTINE_BEATS_MAX,
      ROUTINE_BEATS_DEFAULT,
    ),
    bpm: clampInteger(
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
  const bytes = decodeBase64UrlBytes(token);
  if (!bytes?.length) return null;

  let record: Record<string, unknown> | null;
  try {
    record =
      bytes[0] === JSON_LINK_FIRST_BYTE
        ? readJsonRecord(bytes)
        : bytes[0] === ROUTINE_LINK_FORMAT
          ? readBinaryRecord(bytes)
          : null;
  } catch {
    return null;
  }
  return record ? coerceRoutine(record) : null;
}

function readJsonRecord(bytes: Uint8Array): Record<string, unknown> | null {
  const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const parsed: unknown = JSON.parse(json);
  return isPlainObject(parsed) && isPlainObject(parsed.r) ? parsed.r : null;
}

// Rebuilds the JSON-shaped record so both formats share the same coercion.
function readBinaryRecord(bytes: Uint8Array): Record<string, unknown> {
  const reader = new ByteReader(bytes);
  reader.u8();
  const tableSize = reader.varint();
  const table: string[] = [];
  for (let i = 0; i < tableSize; i += 1) table.push(reader.string());
  const text = () => table[reader.varint()];

  const name = text();
  const startBlock = {
    systemId: text(),
    strings: reader.varint(),
    presetName: text(),
    beats: reader.varint(),
  };

  const stepCount = reader.varint();
  const steps: Record<string, unknown>[] = [];
  let previous: Record<string, unknown> = STEP_BASELINE;
  for (let i = 0; i < stepCount; i += 1) {
    const mask = reader.u8();
    const step = { ...previous };
    STEP_FIELDS.forEach((field, bit) => {
      if (!(mask & (1 << bit))) return;
      step[field] = STRING_STEP_FIELDS.has(field) ? text() : reader.varint();
    });
    steps.push(step);
    previous = step;
  }

  return { name, startBlock, steps };
}

function coerceRoutine(record: Record<string, unknown>): Routine | null {
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
