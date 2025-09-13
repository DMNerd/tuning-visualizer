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
