# Plan: make microtonal gv's theory engine

Status: in progress. Decisions D1–D3 accepted as recommended (2026-09-27).

## Principles

- **Microtonal is the engine.** Anything gv computes about notes, intervals,
  chords or scales comes from the fork
  ([DMNerd/microtonal](https://github.com/DMNerd/microtonal)). When the fork
  lacks something, extend the fork, not gv.
- **gv keeps integer pitch classes (`0..N-1`) as its internal model.**
  Fretboard, stores, share codec, presets and routines are unchanged. The fork
  is only called through one adapter, `src/domain/theory/tonalAdapter.ts`, and
  an ESLint `no-restricted-imports` rule forbids `@vendor/microtonal` everywhere
  else.
- **Distribution stays as is:** the git-ignored vendored bundle, pinned by
  `vendor/microtonal/SOURCE.json`. Each fork change: commit and push, run
  `pnpm vendor:microtonal`, commit the pin.
- **12- and 24-TET behave exactly as today.** Characterization tests capture the
  current outputs before each module is replaced. Other EDOs follow the EDO
  policy (D1), and every changed value gets listed.
- **Every fork change and every deviation from upstream Tonal goes in the
  fork's README**, in the same step.

## Current state (before this plan)

| Area                     | State                                                                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fork stages 1–3          | Done: ups/downs, `edoSteps`/`edoChroma`/`edoFreq`/`fromEdoSteps`, `Pcset {edo}`, `forEdo`, `Chord.detect {edo}`, tier ranking, maqamat                   |
| gv: fork wiring          | Vendored bundle, `@vendor/*` alias, CI and Docker rebuild from the pin                                                                                   |
| gv: chord identification | `chordIdentify.ts` wraps `Chord.detect`                                                                                                                  |
| gv: chord formulas       | `chords.ts` defines chords by intervals; the fork computes 12/24 steps; other EDOs still use proportional 12-TET scaling                                 |
| gv: removed              | `degreeForStep`, the step tables, `projectStepsFrom12TET`, and the unused freq/midi/cents helpers (the fork's `Note.edoFreq` covers them if ever needed) |

## Decisions

- **D1 — EDO policy (accepted).** Use fifth-based spelling when
  `edoSharp(edo) ≥ 1` and the EDO's fifth is within about 15¢ of 3/2; otherwise
  fall back to proportional 12-TET mapping, implemented in the fork. The exact
  threshold is confirmed against the G0 diff table. Accepted consequence: in
  22-EDO a major chord becomes `0,8,13` (Pythagorean third, ≈436¢; today 7
  steps, ≈382¢); the 5/4-like third is spelled `↓3M`.
- **D2 — 24-TET flat-view names (accepted: normalize).** gv's flat table is
  irregular; everything except pitch classes 3 (`Db↑`) and 7 (`Eb↑`) follows
  "flat or natural at or above, minus downs". Normalize to the rule: those two
  become `D↓` and `E↓`. Saved names keep parsing.
- **D3 — scales in other EDOs (accepted).** Custom EDOs get the full
  traditional scale list (plus microtonal scales where D1 allows) instead of
  four "Generic …-like" scales. Old baseline labels are migrated (theory store
  `scale`, routine `scaleLabel`).
- **D4 — scales from the fork (accepted 2026-10-01).** gv defines no scales:
  every tuning offers all of the fork's scales for its EDO
  (`ScaleType.forEdo`: traditional, maqamat and other microtonal scales,
  temperament scales) plus the full chromatic scale, sorted by label, with
  title-cased fork names ("Major", "Harmonic Minor", "Rast"). Old labels
  (theory store, routines, favourites) are migrated. gv's microtonal scales
  were replaced by sourced fork scales: Uşşak (gv's intervals) is husayni,
  "Major w/ Neutral 3rd" is mahur, Hüseyni and Hijaz-ish map to husayni and
  hijaz (different notes), Neva and Uşak Maṣri to bayati; the three neutral
  scales without a source are gone.

## Fork work (F) — each with tests and a README entry

- **F1: spelling with accidental preference.** `Note.fromEdoSteps(steps, edo,
{ accidental: "sharp" | "flat", pitchClass })`, plus
  `Note.edoNames(edo, accidental)`. Sharp: nearest sharp-or-natural at or
  below, plus ups. Flat: nearest flat-or-natural at or above, minus downs.
  Tests: 12-TET both views, 24-TET both views (per D2), and a round trip
  through `Note.edoChroma` for EDOs 5–72.
- **F2: EDO policy (D1).** `edoProfile(edo)` →
  `{ fifth, sharp, fifthErrorCents, spelling: "fifths" | "proportional" }`.
  `Interval.edoSteps`, `Pcset.get(…, {edo})`, `ChordType.forEdo` and
  `ScaleType.forEdo` use proportional mapping when the profile says so.
  Default 12-EDO results are unchanged.
- **F3: gv's scale catalog as fork scale data.** Port gv's 23 12-TET and 29
  24-TET scales into `scale-type`: missing traditional ones, plus the 24-TET
  makam/maqam flavours as microtonal scales in ups/downs. Spellings are
  derived automatically from gv's step lists, then the maqam/makam ones are
  reviewed by hand, since the spelling decides how they map into other EDOs.
  Each scale gets a stable name; gv keeps its display labels.
- **F4 (optional):** `Pcset.chromas({ edo })` and `ChordType`/`ScaleType`
  lookup by chroma within an EDO. Only if G3/G4 need it.

## gv work (G) — one step at a time; `pnpm check` and `pnpm test` after each

- **G0: characterization tests** before touching anything:
  - Names: 12/24, sharp/flat/both, English/German.
  - `buildChordPCsFromPc`: all types × EDOs 5–72.
  - Scale pitch-class sets per system, `Chord.detect` results, and
    respell-hook behaviour.
  - The D1 diff table: old vs. fork for every EDO.
- **G1: adapter.** `tonalAdapter.ts` exposes `pcToName(pc, edo, accidental)`,
  `nameToPc(name, edo)`, `chordPcs(chordId, rootPc, edo)`,
  `scalePcs(scaleId, rootPc, edo)`, `scalesForEdo(edo)` and
  `detectChord(pcs, edo, bassPc)`. `chords.ts` and `chordIdentify.ts` route
  through it; add the ESLint import rule.
- **G2: names** (needs F1). `TuningSystem` shrinks to
  `{ id, divisions, refFreq, refMidi }`. `nameForPc` and `pcForName` come from
  the adapter; the 12-TET arrays, `N24_NAMES_*` and `nameFallback` are deleted;
  custom EDOs get real names instead of `N5`. `notation.ts` keeps
  German/Czech rendering and parsing as a layer over English names; its arrow
  parsing goes where the adapter parses.
- **G3: chords** (needs F2). `chords.ts` becomes a table: app chord id →
  { label, fork chord type }, kept for the chord picker, persisted `chordType`
  values and the finder's "Show" mapping. `buildChordPCsFromPc` moves to the
  adapter; gv's proportional branch is removed. Other EDOs change per D1.
- **G4: scales** (needs F3, D3). `scales.ts` becomes a label ↔ fork scale-name
  map plus the label migration. `buildBaselineScalesForSystem`,
  `SCALES_12`/`SCALES_24` and `projectFrom12TET` are removed. `useRandomScale`
  draws from `scalesForEdo`. Store and routine migration for old labels.
- **G5: respelling.** `useAccidentalRespell` and `useSystemNoteNames` use the
  adapter (`nameToPc` with the old preference, then `pcToName` with the new
  one). No fork `enharmonic` is needed.
- **G6: wrap-up.** Re-vendor, run the full release gate, `jscpd --health`,
  update `docs/project-structure.md` (adapter rule). Summary: functions and
  lines removed, behaviour changes outside 12/24.

## Out of scope (kept in gv)

- Integer set helpers: `capoChords.ts` (capo offsets, `transposePitchClassSet`),
  `chordToneAnalysis.js`, `buildChordFit` — small set operations on
  pitch-class numbers; routing them through the fork would add conversions for
  no gain.
- `fretboardShapes.ts`, `shapeSystems.ts`, `fretLabels.ts`, `degreeColors.ts`,
  `findSystemByEdo`/`getSystemLabel`, German/Czech naming, and every
  non-theory feature.

## Order

G0 → G1 → F1 → G2 → F2 → G3 → F3 → G4 → G5 → G6. Each fork step ends with
commit, push and re-vendor, so gv only ever builds against a pinned, pushed
fork commit.

## Progress log

All steps done (2026-09-27). Fork changes are uncommitted until pushed; gv's
pin (`vendor/microtonal/SOURCE.json`) must be refreshed after that.

- **G0** — `src/tests/domain/theory/characterization.test.js` with the fixture
  `src/tests/fixtures/theoryCharacterization.json`: names and parsing (12/24,
  all accidental and naming modes), chord pitch classes (EDOs 5–72), scale
  lists, chord detection (12/24). 12/24 must match; other EDOs are reported
  (`CHARACTERIZE_REPORT=<file>`). Intentional 12/24 changes are listed in the
  test with the decision that allows them.
- **G1** — `tonalAdapter.ts`; `chords.ts` and `chordIdentify.ts` go through it;
  ESLint `no-restricted-imports` blocks `@vendor/microtonal` elsewhere.
- **F1** — fork: `Note.edoNames(edo, "sharp" | "flat")` and
  `Note.fromEdoSteps(…, { accidental })`. Beyond the plan, two tie-breaks keep
  other EDOs idiomatic: a double accidental costs as much as an up (31-EDO
  step 1 is `C↑`, not `B##`), and `E#`/`B#`/`Cb`/`Fb` lose ties (17-EDO step 1
  is `Db`).
- **G2** — names from the adapter; `TuningSystem` is
  `{ id, divisions, refFreq, refMidi }`; the name tables, `nameFallback` and
  per-system `nameForPc` are gone. Parsing tries the display names, then any
  spelling the fork parses (incl. German via `germanToEnglishNoteName`), then
  legacy `N<k>` names. `notation.ts` keeps its arrow handling: it is the
  German/Czech rendering layer (↑/↓ ↔ ih/eh), not a parser.
- **F2** — fork: `edoProfile(edo)`; proportional EDOs size pitches by scaling
  12-TET. The threshold (sharp ≥ 1, fifth within 15¢) was confirmed: exactly
  the EDOs where stacked fifths collapse chords are proportional.
- **G3** — deviation: `chords.ts` keeps short interval strings instead of fork
  chord-type names, because gv's `quartal` is the 3-note `1P 4P 7m` and the
  fork only has a 4-note quartal. gv's proportional branch is gone; the
  microtonal chord types (and the chord picker) follow the fork's rule (EDOs
  spelled by fifths with a sharp of 2+ steps) instead of "24-TET only".
- **F3** — deviation: nothing was ported into the fork. All 22 standard gv
  scales already exist in the fork's dictionary with identical notes, and gv's
  9 microtonal scales are app content, so they stay in gv as ups/downs
  interval strings (`scales.ts`) that the fork sizes for every EDO.
- **G4** — `scalesForSystem(systemId, divisions)` replaces `SCALES_12`,
  `SCALES_24`, `ALL_SCALES`, `BASELINE_PATTERNS_FROM_12`, `projectFrom12TET`
  and `buildBaselineScalesForSystem`; `migrateScaleLabel` handles old
  custom-EDO labels (theory store validation, routine decoding).
- **G5** — no code change needed: `useAccidentalRespell` parses and renders
  through the pitch mapping, which uses the adapter since G2.
  `useRandomScale` draws from the fork-computed scale options.
- **G6** — every value that changed outside 12/24-TET:
  [microtonal-migration-changes.md](microtonal-migration-changes.md).
- **Fork update (2026-10-01)** — re-vendored at `d232b5a8`. The fork's
  default became "every EDO by fifths"; the adapter calls
  `setEdoSpelling("proportional-fallback")` to keep D1, and looks chord types
  up with the EDO. Changes: [microtonal-migration-changes.md](microtonal-migration-changes.md#fork-update-to-d232b5a8-2026-10-01).
