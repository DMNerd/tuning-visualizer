import { useMemo, useCallback } from "react";
import { useLatest } from "react-use";

export const LABEL_OPTIONS = [
  { value: "names", label: "Note names" },
  { value: "degrees", label: "Degrees" },
  { value: "intervals", label: "Intervals (12-TET relative)" },
  { value: "edoSteps", label: "EDO steps" },
  { value: "fret", label: "Fret number" },
  { value: "off", label: "Off" },
];

export const LABEL_VALUES = LABEL_OPTIONS.map((o) => o.value);

const INTERVAL_12 = [
  "P1",
  "m2",
  "M2",
  "m3",
  "M3",
  "P4",
  "TT",
  "P5",
  "m6",
  "M6",
  "m7",
  "M7",
];

function roundToInt(x) {
  const EPS = 1e-9;
  return Math.abs(x) < EPS ? 0 : Math.round(x);
}

/**
 * Context-anchored formatter for arbitrary N-TET.
 * - sharp mode: anchor to LOWER semitone
 *   -> upward microsteps display as "+"
 * - flat mode:  anchor to UPPER semitone
 *   -> downward microsteps display as "−"
 *
 * Examples in 24-TET (N=24):
 *  d=1 (≈50¢): sharp => P1+ ; flat => m2−
 *  d=3 (≈150¢): sharp => M2− ; flat => m3− (depends on anchor)
 */

function formatIntervalGenericN(d, N, accidental) {
  const exactSemis = (d * 12) / N;
  const baseSemis =
    accidental === "flat" ? Math.ceil(exactSemis) : Math.floor(exactSemis);
  const name = INTERVAL_12[((baseSemis % 12) + 12) % 12];
  const baseSteps = (baseSemis * N) / 12;
  const offset = roundToInt(d - baseSteps);
  if (offset === 0) return name;
  const sign = offset > 0 ? "+" : "−";
  return name + sign.repeat(Math.abs(offset));
}

function makeIntervalFormatter(system, rootIx, accidental) {
  const N = system.divisions;
  if (N === 12) {
    return (pc) => {
      const d = (pc - rootIx + 12) % 12;
      return INTERVAL_12[d];
    };
  }
  return (pc) => {
    const d = (pc - rootIx + N) % N;
    return formatIntervalGenericN(d, N, accidental);
  };
}

export function useLabels({
  mode,
  system,
  rootIx,
  degreeForPc,
  nameForPc,
  accidental = "sharp",
}) {
  const intervalOf = useMemo(
    () => makeIntervalFormatter(system, rootIx, accidental),
    [system, rootIx, accidental],
  );

  const degreeForPcRef = useLatest(degreeForPc);
  const nameForPcRef = useLatest(nameForPc);

  const labelFor = useCallback(
    (pc, fret) => {
      switch (mode) {
        case "off":
          return "";
        case "degrees": {
          const d = degreeForPcRef.current(pc);
          return d == null ? "" : String(d);
        }
        case "intervals":
          return intervalOf(pc);
        case "names":
          return nameForPcRef.current(pc);
        case "edoSteps": {
          const steps = (pc - rootIx + system.divisions) % system.divisions;
          return String(steps);
        }
        case "fret":
          return String(fret);
        default:
          return "";
      }
    },
    [mode, intervalOf, degreeForPcRef, nameForPcRef, rootIx, system],
  );

  return useMemo(
    () => ({ labelFor, intervalOf, LABEL_OPTIONS }),
    [labelFor, intervalOf],
  );
}
