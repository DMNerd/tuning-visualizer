// Characterization tests for the microtonal migration
// (docs/microtonal-migration-plan.md, step G0).
//
// They pin down what gv's theory code outputs today, so each module can be
// replaced by the microtonal fork without changing 12- and 24-TET behaviour.
// Values for other EDOs are recorded too, but they are allowed to change
// (decision D1): `edoDiffs` lists them instead of failing.
//
// Regenerate the fixture (only when a change is intended):
//   CHARACTERIZE_UPDATE=1 pnpm test src/tests/domain/theory/characterization.test.js

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { TUNINGS, findSystemByEdo } from "@domain/theory/tuning";
import { buildChordPCsFromPc, migrateChordType } from "@domain/theory/chords";
import { migrateScaleLabel, scalesForSystem } from "@domain/theory/scales";
import { formatChordSymbol, identifyChord } from "@domain/theory/chordIdentify";
import {
  buildNameToPcMap,
  nameForPcWithDisplayAccidentals,
  resolvePcForName,
} from "@features/fretboard/hooks/usePitchMapping";

// Test options come from the environment (node:test runs under Node)
const env = globalThis.process?.env ?? {};
const FIXTURE = new URL(
  "../../fixtures/theoryCharacterization.json",
  import.meta.url,
);
const EDOS = Array.from({ length: 68 }, (_, i) => i + 5); // 5..72
const MAIN_SYSTEMS = ["12-TET", "24-TET"];
// gv's chord types when the fixture was recorded (D5: now the theory
// engine's chord symbols, see migrateChordType)
const CHORD_TYPES = [
  "maj",
  "min",
  "dim",
  "aug",
  "sus2",
  "sus4",
  "6",
  "m6",
  "7",
  "maj7",
  "m7",
  "m7b5",
  "dim7",
  "add9",
  "neut",
  "neut7",
  "sus2↓",
  "sus4↑",
  "maj↑3",
  "min↓3",
  "quartal",
];
const ACCIDENTALS = ["sharp", "flat", "both"];
const NAMINGS = ["english", "german"];

// Intentional changes to 12/24-TET values: [path into the fixture, new
// value, the plan decision that allows it].
const D2 = "D2: 24-TET flat names follow one rule (Db↑ -> D↓, Eb↑ -> E↓)";
const ALLOWED_CHANGES = [
  [["names", "24-TET/flat/english", 3], "D↓", D2],
  [["names", "24-TET/flat/english", 7], "E↓", D2],
  [["names", "24-TET/flat/german", 3], "Deh", D2],
  [["names", "24-TET/flat/german", 7], "Eeh", D2],
  [["names", "24-TET/both/english", 3], "C#↑/D↓", D2],
  [["names", "24-TET/both/english", 7], "D#↑/E↓", D2],
  [["names", "24-TET/both/german", 3], "Cisih/Deh", D2],
  [["names", "24-TET/both/german", 7], "Disih/Eeh", D2],
];

const systemFor = (edo) =>
  TUNINGS[`${edo}-TET`] ?? findSystemByEdo(TUNINGS, edo).system;
const sortedPcs = (set) => [...set].sort((a, b) => a - b);

function characterize() {
  const names = {};
  const parse = {};
  for (const id of MAIN_SYSTEMS) {
    const system = TUNINGS[id];
    for (const accidental of ACCIDENTALS) {
      for (const naming of NAMINGS) {
        const key = `${id}/${accidental}/${naming}`;
        names[key] = Array.from({ length: system.divisions }, (_, pc) =>
          nameForPcWithDisplayAccidentals(system, pc, accidental, naming),
        );
        parse[key] = Object.fromEntries(
          [...buildNameToPcMap(system, naming, accidental)].sort(([a], [b]) =>
            a.localeCompare(b),
          ),
        );
      }
    }
  }

  const otherEdoNames = {};
  for (const edo of EDOS) {
    if (edo === 12 || edo === 24) continue;
    const system = systemFor(edo);
    otherEdoNames[edo] = Array.from({ length: edo }, (_, pc) =>
      nameForPcWithDisplayAccidentals(system, pc, "sharp", "english"),
    );
  }

  const chordPcs = {};
  for (const edo of EDOS) {
    chordPcs[edo] = Object.fromEntries(
      CHORD_TYPES.map((type) => [
        type,
        sortedPcs(buildChordPCsFromPc(0, migrateChordType(type), edo)),
      ]),
    );
  }

  const scales = [
    ...scalesForSystem("12-TET", 12),
    ...scalesForSystem("24-TET", 24),
  ].map(({ label, systemId, pcs }) => ({
    label,
    systemId,
    pcs,
  }));
  const baselineScales = {};
  for (const edo of EDOS) {
    baselineScales[edo] = scalesForSystem(`${edo}-TET`, edo).map(
      ({ label, pcs }) => ({ label, pcs }),
    );
  }

  const detection = {};
  for (const edo of [12, 24]) {
    const nameForPc = (pc) =>
      nameForPcWithDisplayAccidentals(TUNINGS[`${edo}-TET`], pc, "sharp");
    for (const type of CHORD_TYPES) {
      for (let root = 0; root < edo; root += 1) {
        const pcs = sortedPcs(
          buildChordPCsFromPc(root, migrateChordType(type), edo),
        );
        // bass = root, and the chord's second tone as bass (an inversion)
        for (const bass of [root, pcs.find((pc) => pc !== root)]) {
          const key = `${edo}/${pcs.join(",")}/${bass}`;
          if (key in detection) continue;
          detection[key] = identifyChord(pcs, edo, bass).map(
            (match) =>
              `${formatChordSymbol(match, nameForPc)}:${match.appType ?? "-"}`,
          );
        }
      }
    }
  }

  return {
    names,
    parse,
    otherEdoNames,
    chordPcs,
    scales,
    baselineScales,
    detection,
  };
}

// Values for EDOs other than 12/24 that differ from the fixture.
function edoDiffs(current, recorded) {
  const diffs = [];
  for (const section of ["otherEdoNames", "chordPcs", "baselineScales"]) {
    for (const [edo, value] of Object.entries(current[section])) {
      if (edo === "12" || edo === "24") continue;
      const before = JSON.stringify(recorded[section][edo]);
      const after = JSON.stringify(value);
      if (before !== after) diffs.push({ section, edo, before, after });
    }
  }
  return diffs;
}

// Every name that parsed before must still parse to the same pitch class
// (the parser may accept more names now).
function reparse(recordedParse) {
  return Object.fromEntries(
    Object.entries(recordedParse).map(([key, entries]) => {
      const [id, accidental, naming] = key.split("/");
      const system = TUNINGS[id];
      const map = buildNameToPcMap(system, naming, accidental);
      return [
        key,
        Object.fromEntries(
          Object.keys(entries).map((name) => [
            name,
            resolvePcForName(map, name, system.divisions),
          ]),
        ),
      ];
    }),
  );
}

function main12And24(snapshot) {
  const pick = (obj, keep) =>
    Object.fromEntries(Object.entries(obj).filter(([k]) => keep(k)));
  return {
    names: snapshot.names,
    parse: snapshot.parse,
    chordPcs: pick(snapshot.chordPcs, (edo) => edo === "12" || edo === "24"),
  };
}

function applyAllowedChanges(recorded) {
  const copy = structuredClone(recorded);
  for (const [path, value] of ALLOWED_CHANGES) {
    const keys = [...path];
    const last = keys.pop();
    let target = copy;
    for (const k of keys) target = target[k];
    target[last] = value;
  }
  return copy;
}

test("theory outputs for 12- and 24-TET are unchanged", () => {
  const current = characterize();
  if (env.CHARACTERIZE_UPDATE) {
    fs.writeFileSync(FIXTURE, `${JSON.stringify(current, null, 1)}\n`);
    return;
  }
  const recorded = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  const expected = main12And24(applyAllowedChanges(recorded));
  const actual = main12And24({
    ...current,
    parse: reparse(recorded.parse),
  });
  for (const section of Object.keys(expected)) {
    assert.deepEqual(actual[section], expected[section], section);
  }
});

// D5: chord types are the fork's chord symbols. Detection is unchanged, but
// the chord type a match loads into the controls is its symbol: recorded
// gv types map through migrateChordType, and chords gv didn't have ("-")
// may now be loadable. The added quartal triad (7sus4no5) is one more match.
test("12- and 24-TET chord detection is unchanged (D5)", () => {
  const recorded = JSON.parse(fs.readFileSync(FIXTURE, "utf8")).detection;
  const current = characterize().detection;
  for (const [key, matches] of Object.entries(recorded)) {
    const now = current[key].filter((m) => !m.includes("7sus4no5"));
    assert.equal(now.length, matches.length, key);
    matches.forEach((match, i) => {
      const [symbol, type] = match.split(":");
      const [nowSymbol, nowType] = now[i].split(":");
      assert.equal(nowSymbol, symbol, key);
      if (type !== "-") assert.equal(nowType, migrateChordType(type), key);
    });
  }
});

// D4: scales come from the fork's dictionary under its names. Every 12/24-TET
// scale still exists under its migrated label with the same notes, except
// gv's old microtonal scales: these map to the maqam they meant, or are gone.
const D4_CHANGED = {
  "24TET Hüseyni": "Husayni: the makam has a downmajor 6th (↓6M), not 6M",
  "24TET Hijaz-ish": "Hijaz: Maqam World's hijaz (Rast on the 4th)",
  "24TET Neva (¾-sharp LT, KG style)": "Bayati: Neva uses the Uşşak scale",
  "24TET Uşak Maṣri (Hijaz on 5th)": "Bayati: the Uşşak scale",
  "24TET Neutral Heptatonic": "no maqam or makam source",
  "24TET Minor w/ Neutral 6th": "no maqam or makam source",
  "24TET Neutral Pentatonic": "no maqam or makam source",
};

test("12- and 24-TET scales survive under their migrated labels", () => {
  const recorded = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  for (const { label, systemId, pcs } of recorded.scales) {
    if (label in D4_CHANGED) continue;
    const edo = systemId === "24-TET" ? 24 : 12;
    const current = scalesForSystem(systemId, edo).find(
      (scale) => scale.label === migrateScaleLabel(label),
    );
    assert.deepEqual(current?.pcs, pcs, `${systemId} ${label}`);
  }
});

// Not a failure: D1 allows other EDOs to change. Run with
// CHARACTERIZE_REPORT=<file> to write the full before/after list.
test("changes in other EDOs are reported", (t) => {
  if (env.CHARACTERIZE_UPDATE) return;
  const recorded = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
  const diffs = edoDiffs(characterize(), recorded);
  const bySection = {};
  for (const { section } of diffs) {
    bySection[section] = (bySection[section] ?? 0) + 1;
  }
  t.diagnostic(`other-EDO changes: ${JSON.stringify(bySection)}`);
  if (env.CHARACTERIZE_REPORT) {
    fs.writeFileSync(
      env.CHARACTERIZE_REPORT,
      `${JSON.stringify(diffs, null, 1)}\n`,
    );
  }
});
