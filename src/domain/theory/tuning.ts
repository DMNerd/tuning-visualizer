// Tuning systems (equal divisions of the octave). Note names come from the
// theory adapter (see tonalAdapter.ts), not from here.

type TuningSystem = {
  id: string; // e.g. "12-TET", "24-TET"
  divisions: number; // N: divisions per octave
  refFreq: number; // A4 reference
  refMidi: number; // A4 midi (69)
};

const TUNING_FALLBACK_REF_FREQ = 440;
const TUNING_FALLBACK_REF_MIDI = 69;

export const TUNINGS: Record<string, TuningSystem> = {
  "12-TET": { id: "12-TET", divisions: 12, refFreq: 440, refMidi: 69 },
  "24-TET": { id: "24-TET", divisions: 24, refFreq: 440, refMidi: 69 },
};

export type TuningLookupResult = {
  id: string;
  system: TuningSystem;
};

export function findSystemByEdo(
  systems: Record<string, TuningSystem> | null | undefined,
  edo: number,
  metaSystemId?: string | null,
): TuningLookupResult | null {
  if (!Number.isFinite(edo) || edo <= 0) {
    return null;
  }

  const metaId = typeof metaSystemId === "string" ? metaSystemId : null;

  if (
    metaId &&
    systems &&
    Object.prototype.hasOwnProperty.call(systems, metaId)
  ) {
    const system = systems[metaId];
    if (system) {
      return { id: metaId, system };
    }
  }

  const key = `${edo}-TET`;
  if (systems && Object.prototype.hasOwnProperty.call(systems, key)) {
    const system = systems[key];
    if (system) {
      return { id: key, system };
    }
  }

  if (systems) {
    for (const [id, system] of Object.entries(systems)) {
      if (!system) continue;
      const divisions = Number(system.divisions);
      if (Number.isFinite(divisions) && divisions === edo) {
        return { id, system };
      }
    }
  }

  const fallbackId = `${edo}-TET`;
  return {
    id: fallbackId,
    system: {
      id: fallbackId,
      divisions: edo,
      refFreq: TUNING_FALLBACK_REF_FREQ,
      refMidi: TUNING_FALLBACK_REF_MIDI,
    },
  };
}

export function getSystemLabel({
  match,
  edo,
  metaSystemId,
}: {
  match: TuningLookupResult | null;
  edo: number;
  metaSystemId?: string | null;
}): string {
  // Empty string must be treated the same as absent here, matching
  // findSystemByEdo's truthy `metaId &&` check — otherwise a pack with
  // `meta.systemId: ""` shows a blank label instead of falling through to
  // the resolved match/edo below.
  if (typeof metaSystemId === "string" && metaSystemId) {
    return metaSystemId;
  }

  if (match?.id) {
    return match.id;
  }

  if (Number.isFinite(edo) && edo > 0) {
    return `${edo}-TET`;
  }

  return "Unknown system";
}
