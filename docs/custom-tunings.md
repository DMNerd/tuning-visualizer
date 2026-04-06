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
  "spelling": "german",
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
    "board": { "hiddenFrets": [0, 1] },
    "stringMeta": [{ "index": 0, "startFret": 5, "greyBefore": true }]
  }
}
```

### Field reference

**Top-level**

- `version` (number, optional for parsing, exporter writes `2`): tag for your own bookkeeping.
- `name` (string, required): shown in the UI.
- `spelling` (string, optional): spelling hint for note parsing. If set to a Germanic/Czech marker (`"german"`, `"germanic"`, `"czech"`, `"cz"`, `"de"`, `"de h/b"`, `"de-h/b"`, `"de_h/b"`, `"h/b"`), note tokens are translated to international spellings internally (for example `H` → `B`, `B` → `Bb`, `Fis` → `F#`, `Hih` → `B↑`, `Aeh` → `A↓`).
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
- `board` (object): optional board-level rendering directives.
  - `hiddenFrets` (number array): absolute rendered-fret indices to suppress.
    - Indices are **0-based rendered fret indices** for the active EDO/N-TET system (not hardcoded 12‑TET scale degrees).
    - Use explicit indices as shown (for example `[0, 1, 13]`). Pattern/modulo shorthand is not supported in JSON right now, so repeat values per octave manually if needed.
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
- **German/Czech preset spelling.** If your JSON uses `H/B/Fis/Es/...`, set top-level `spelling` to a Germanic/Czech value (for example `"german"`, `"czech"`, or `"cz"`). Internally the app stores/uses international spellings and only localizes at display time.
- **Microtonal German suffixes work too.** With `spelling: "german"` or `spelling: "czech"`, both `ih/eh` suffixes and arrow forms are accepted (`Hih` or `B↑`, `Aeh` or `A↓`).
- **Order matters.** Strings are read top‑to‑bottom in the JSON array the same way they’re drawn in the UI.
- **Short strings (banjo, etc.).** Put `startFret` and `greyBefore: true` on that string (and optionally mirror in `meta.stringMeta`).

Microtonal example:

```json
{
  "name": "24-TET Germanic micro example",
  "spelling": "german",
  "system": { "edo": 24 },
  "tuning": {
    "strings": [{ "note": "Hih" }, { "note": "Aeh" }, { "note": "Fis" }]
  }
}
```

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
