// Deliberately separate from METRONOME_TIME_SIGNATURES
// (@features/practice/model/controlModel.js), which omits odd meters like 7/4
// that training routines need to express.
export const ROUTINE_TIME_SIGNATURES = [
  "2/4",
  "3/4",
  "4/4",
  "5/4",
  "6/4",
  "7/4",
  "5/8",
  "6/8",
  "7/8",
  "9/8",
  "10/8",
] as const;

export type RoutineTimeSignature = (typeof ROUTINE_TIME_SIGNATURES)[number];

export const ROUTINE_TIME_SIGNATURE_DEFAULT: RoutineTimeSignature = "4/4";

export function isRoutineTimeSignature(
  value: unknown,
): value is RoutineTimeSignature {
  return (
    typeof value === "string" &&
    (ROUTINE_TIME_SIGNATURES as readonly string[]).includes(value)
  );
}
