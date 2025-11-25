# Custom Tunings (JSON) — Visualizer Format

> TL;DR: Put one JSON object per tuning. Each string needs a `note` **or** a `midi` number. Optional per‑string meta includes `startFret` and `greyBefore` (for short strings like 5‑string banjo). Labels are _purely cosmetic_ and can be omitted.

---

## Quick start

1. Create `my-tuning.json` with this template (12‑TET guitar E standard):

```json
{
  "version": 2,
  "name": "Guitar (E Standard)",
  "system": { "edo": 12 },
  "tuning": {
    "strings": [
      { "label": "6th", "note": "E" },
      { "label": "5th", "note": "A" },
      { "label": "4th", "note": "D" },
      { "label": "3rd", "note": "G" },
      { "label": "2nd", "note": "B" },
      { "label": "1st", "note": "E" }
    ]
  }
}
```

2. Import it via **Export → Import Tuning** in the app.

> You can also import multiple tunings by providing a JSON **array** of objects: `[ {...}, {...} ]`.

---

## Full structure

```json
{
  "version": 2,
  "name": "My Custom Tuning",
  "system": { "edo": 12 },
  "tuning": {
    "strings": [
      {
        "label": "optional display label",
        "note": "C#",
        "midi": 61,
        "startFret": 5,
        "greyBefore": true
      }
    ]
  },
  "meta": {
    "systemId": "12-TET",
    "strings": 6,
    "frets": 22,
    "createdAt": "2025-09-13T10:00:00.000Z",
    "stringMeta": [{ "index": 0, "startFret": 5, "greyBefore": true }]
  }
}
```

### Field reference

**Top-level**

- `version` (number, optional for parsing, exporter writes `2`): tag for your own bookkeeping.
- `name` (string, required): shown in the UI.
- `system.edo` (number, required): equal divisions of the octave (12 for 12‑TET, 19 for 19‑TET, etc.).
- `system.id` (string, optional): internal system key (e.g., `12-TET`, `19-TET`). When provided, the UI will label the system with this identifier instead of the raw `edo` value.
- `system.name` (string, optional): human-friendly name shown in editors and exports (e.g., "Pelog (7-step)").
- `system.steps` (number[], optional): per-step cent offsets for each division. Must contain exactly `edo` entries. Frequency, MIDI, and cents conversions honor this table instead of assuming equal spacing.
- `system.ratios` (number[], optional): per-step frequency ratios. Must contain exactly `edo` entries. Overrides `system.steps` and uniform EDO spacing when present.
- `system.refFreq` (number, optional): reference frequency (Hz) for the system.
- `system.refMidi` (number, optional): MIDI note index that corresponds to `refFreq`.

**Strings (array, required, ≥1)**

- `label` (string, optional): purely cosmetic (e.g., `6th`, `1st`). You can **omit** this entirely.
- `note` (string, optional\*): pitch‑class **without octave** (`E`, `F#`, `Bb`, …).
- `midi` (number, optional\*): alternative to `note`. If present, UI still treats it as a pitch‑class.
- `startFret` (number, optional): first playable fret (e.g., `5` for banjo’s short string).
- `greyBefore` (boolean, optional): draw a grey stub from nut to `startFret - 1`.

\* Each string must have **either** `note` **or** `midi`.

**meta (object, optional)**

- `systemId` (string): app’s internal system key if known (e.g., `12-TET`).
- `strings` (number): total strings (the UI may adopt this on import).
- `frets` (number): number of frets (the UI may adopt this on import).
- `createdAt` (ISO string): informational.
- `stringMeta` (array): optional mirror of per‑string metadata with indices:
  - `index` (0‑based), `startFret` (number), `greyBefore` (boolean). If both the string and `meta.stringMeta` define the same property for the same index, **the per‑string field wins**.

---

## Example: 5‑string banjo (Open G, short 5th string)

This example models the short 5th string starting at fret 5 and showing a grey stub before it. Labels are included for readability, but **they are optional**.

```json
{
  "version": 2,
  "name": "Banjo (Open G)",
  "system": { "edo": 12 },
  "tuning": {
    "strings": [
      { "label": "5th", "note": "G", "startFret": 5, "greyBefore": true },
      { "label": "4th", "note": "D" },
      { "label": "3rd", "note": "G" },
      { "label": "2nd", "note": "B" },
      { "label": "1st", "note": "D" }
    ]
  },
  "meta": {
    "systemId": "12-TET",
    "strings": 5,
    "frets": 22,
"stringMeta": [{ "index": 0, "startFret": 5, "greyBefore": true }]
  }
}
```

---

## Non-TET systems with explicit steps/ratios

You can describe tunings for systems that are **not evenly divided** by providing per-step cents (`system.steps`) or ratios (`system.ratios`). When either table is present, the app:

- Uses the table for **frequency ↔ step ↔ MIDI** conversions instead of assuming uniform EDO spacing.
- Derives cents deviation from the table, making the visualizer match your exact temperaments.
- Prefers your provided `system.name`/`system.id` in labels instead of `${edo}-TET`.

All tables must include **exactly** `edo` entries.

### Example: 7-note just system

```json
{
  "version": 2,
  "name": "7-limit (just) lyre",
  "system": {
    "edo": 7,
    "id": "7-limit-just",
    "name": "7-limit just",
    "ratios": [1, 1.125, 1.25, 1.333333, 1.5, 1.666667, 1.75],
    "refFreq": 440,
    "refMidi": 69
  },
  "tuning": {
    "strings": [
      { "note": "A" },
      { "note": "E" },
      { "note": "A" },
      { "note": "B" }
    ]
  },
  "meta": {
    "systemId": "7-limit-just",
    "strings": 4,
    "frets": 18
  }
}
```

If you prefer cent tables, replace `ratios` with `steps` such as `[0, 204, 386, 498, 702, 884, 969]`.

---

## Tips & gotchas

- **Octaves are ignored.** Use `E`, not `E2`. Use `F#` or `Gb` — whichever you prefer; import does not change your accidental spelling.
- **Order matters.** Strings are read top‑to‑bottom in the JSON array the same way they’re drawn in the UI.
- **Short strings (banjo, etc.).** Put `startFret` and `greyBefore: true` on that string (and optionally mirror in `meta.stringMeta`).

---

## Multiple tunings in one file

You can import several tunings at once with a JSON array:

```json
[
  {
    "version": 2,
    "name": "Tuning A",
    "system": { "edo": 12 },
    "tuning": { "strings": [{ "note": "E" }] }
  },
  {
    "version": 2,
    "name": "Tuning B",
    "system": { "edo": 12 },
    "tuning": { "strings": [{ "note": "D" }] }
  }
]
```

The UI will import all, and switch to the **last** one.

---
