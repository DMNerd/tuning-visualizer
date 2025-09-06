export const LABEL_OPTIONS = [
  { value: "names", label: "Note names" },
  { value: "degrees", label: "Degrees" },
  { value: "intervals", label: "Intervals (12-TET relative)" },
  { value: "fret", label: "Fret number" },
  { value: "off", label: "Off" },
];

// 12-TET interval names by semitone distance up from root
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

  // pick directional anchor based on accidental context
  const baseSemis =
    accidental === "flat" ? Math.ceil(exactSemis) : Math.floor(exactSemis);

  const name = INTERVAL_12[((baseSemis % 12) + 12) % 12];

  // Convert the anchored semitone back to N-steps and compare
  const baseSteps = (baseSemis * N) / 12; // may be non-integer in exotic N, ok
  const offsetSteps = d - baseSteps; // + above anchor, - below anchor
  const offset = roundToInt(offsetSteps);

  if (offset === 0) return name;

  // Signs now follow absolute direction from the chosen anchor
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
    const d = (pc - rootIx + N) % N; // steps from root in N-TET
    return formatIntervalGenericN(d, N, accidental);
  };
}

/**
 * useLabels — centralized label generator.
 */
export function useLabels({
  mode,
  system,
  rootIx,
  degreeForPc,
  nameForPc,
  accidental = "sharp",
}) {
  const intervalOf = makeIntervalFormatter(system, rootIx, accidental);

  const labelFor = (pc, fret) => {
    switch (mode) {
      case "off":
        return "";
      case "degrees": {
        const d = degreeForPc(pc);
        return d == null ? "" : String(d);
      }
      case "intervals":
        return intervalOf(pc);
      case "names":
        return nameForPc(pc);
      case "fret":
        return String(fret);
      default:
        return "";
    }
  };

  return { labelFor, intervalOf, LABEL_OPTIONS };
}
