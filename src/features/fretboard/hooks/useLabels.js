import { useMemo, useCallback } from "react";
import { intervalLabel } from "@domain/theory/tonalAdapter";

// `labelKey` is a translation key; render it with t()
export const LABEL_OPTIONS = [
  { value: "names", labelKey: "display.labelNames" },
  { value: "degrees", labelKey: "display.labelDegrees" },
  { value: "intervals", labelKey: "display.labelIntervals" },
  { value: "edoSteps", labelKey: "display.labelEdoSteps" },
  { value: "fret", labelKey: "display.labelFret" },
  { value: "off", labelKey: "common.off" },
];

export const LABEL_VALUES = LABEL_OPTIONS.map((o) => o.value);

function makeIntervalFormatter(system, rootIx) {
  const N = system.divisions;
  return (pc) => intervalLabel((((pc - rootIx) % N) + N) % N, N);
}

export function useLabels({ mode, system, rootIx, degreeForPc, nameForPc }) {
  const intervalOf = useMemo(
    () => makeIntervalFormatter(system, rootIx),
    [system, rootIx],
  );

  const labelFor = useCallback(
    (pc, fret) => {
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
    [mode, intervalOf, degreeForPc, nameForPc, rootIx, system],
  );

  return useMemo(
    () => ({ labelFor, intervalOf, LABEL_OPTIONS }),
    [labelFor, intervalOf],
  );
}
