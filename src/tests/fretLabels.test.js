import test from "node:test";
import assert from "node:assert/strict";

import {
  buildFretLabel,
  MICRO_LABEL_STYLES,
  sampleLabels,
} from "@/utils/fretLabels";

// ───────────────── 12‑TET (baseline) ─────────────────
test("12-TET integers only across styles", () => {
  const seqDefault = sampleLabels(0, 13, 12, {});
  const seqLetters = sampleLabels(0, 13, 12, {
    microStyle: MICRO_LABEL_STYLES.Letters,
  });
  const seqAccSharp = sampleLabels(0, 13, 12, {
    microStyle: MICRO_LABEL_STYLES.Accidentals,
    accidental: "sharp",
  });
  const seqAccFlat = sampleLabels(0, 13, 12, {
    microStyle: MICRO_LABEL_STYLES.Accidentals,
    accidental: "flat",
  });
  const seqFrac = sampleLabels(0, 13, 12, {
    microStyle: MICRO_LABEL_STYLES.Fractions,
  });

  const expected = Array.from({ length: 13 }, (_, i) => String(i));
  assert.deepEqual(seqDefault, expected);
  assert.deepEqual(seqLetters, expected);
  assert.deepEqual(seqAccSharp, expected);
  assert.deepEqual(seqAccFlat, expected);
  assert.deepEqual(seqFrac, expected);
});

// ───────────────── 24‑TET (12×k systems) ─────────────────
test("24-TET letters/accidentals/fractions + integer hits", () => {
  assert.equal(
    buildFretLabel(0, 24, { microStyle: MICRO_LABEL_STYLES.Letters }),
    "0",
  );
  assert.equal(
    buildFretLabel(1, 24, { microStyle: MICRO_LABEL_STYLES.Letters }),
    "0a",
  );
  assert.equal(
    buildFretLabel(1, 24, {
      microStyle: MICRO_LABEL_STYLES.Accidentals,
      accidental: "sharp",
    }),
    "0s",
  );
  assert.equal(
    buildFretLabel(1, 24, {
      microStyle: MICRO_LABEL_STYLES.Accidentals,
      accidental: "flat",
    }),
    "1b",
  );
  assert.equal(
    buildFretLabel(1, 24, { microStyle: MICRO_LABEL_STYLES.Fractions }),
    "0½",
  );

  [
    MICRO_LABEL_STYLES.Letters,
    MICRO_LABEL_STYLES.Accidentals,
    MICRO_LABEL_STYLES.Fractions,
  ].forEach((style) => {
    const label = buildFretLabel(2, 24, {
      microStyle: style,
      accidental: "sharp",
    });
    assert.equal(label, "1");
  });

  assert.equal(
    buildFretLabel(3, 24, { microStyle: MICRO_LABEL_STYLES.Letters }),
    "1a",
  );
  assert.equal(
    buildFretLabel(3, 24, {
      microStyle: MICRO_LABEL_STYLES.Accidentals,
      accidental: "sharp",
    }),
    "1s",
  );
  assert.equal(
    buildFretLabel(3, 24, {
      microStyle: MICRO_LABEL_STYLES.Accidentals,
      accidental: "flat",
    }),
    "2b",
  );
  assert.equal(
    buildFretLabel(3, 24, { microStyle: MICRO_LABEL_STYLES.Fractions }),
    "1½",
  );
});

// ───────────────── 36‑TET (12×k with k=3) ─────────────────
test("36-TET letters and accidentals show two distinct micro steps; fractions compact", () => {
  assert.equal(
    buildFretLabel(1, 36, { microStyle: MICRO_LABEL_STYLES.Letters }),
    "0a",
  );
  assert.equal(
    buildFretLabel(2, 36, { microStyle: MICRO_LABEL_STYLES.Letters }),
    "0aa",
  );
  assert.equal(
    buildFretLabel(1, 36, {
      microStyle: MICRO_LABEL_STYLES.Accidentals,
      accidental: "sharp",
    }),
    "0s",
  );
  assert.equal(
    buildFretLabel(2, 36, {
      microStyle: MICRO_LABEL_STYLES.Accidentals,
      accidental: "sharp",
    }),
    "0ss",
  );
  assert.equal(
    buildFretLabel(1, 36, {
      microStyle: MICRO_LABEL_STYLES.Accidentals,
      accidental: "flat",
    }),
    "1bb",
  );
  assert.equal(
    buildFretLabel(2, 36, {
      microStyle: MICRO_LABEL_STYLES.Accidentals,
      accidental: "flat",
    }),
    "1b",
  );
  assert.equal(
    buildFretLabel(1, 36, { microStyle: MICRO_LABEL_STYLES.Fractions }),
    "0⅓",
  );
  assert.equal(
    buildFretLabel(2, 36, { microStyle: MICRO_LABEL_STYLES.Fractions }),
    "0⅔",
  );
});

// ───────────────── N‑TET (non‑multiple of 12) ─────────────────
test("19-TET fractions (unicode slash) and accidental fallback", () => {
  assert.equal(
    buildFretLabel(1, 19, { microStyle: MICRO_LABEL_STYLES.Fractions }),
    "0+¹²⁄₁₉",
  );
  assert.equal(
    buildFretLabel(1, 19, {
      microStyle: MICRO_LABEL_STYLES.Accidentals,
      accidental: "sharp",
    }),
    "0+¹²⁄₁₉",
  );
});

test("19-TET letters use rounded per-semitone buckets", () => {
  assert.equal(
    buildFretLabel(1, 19, { microStyle: MICRO_LABEL_STYLES.Letters }),
    "0a",
  );
  assert.equal(
    buildFretLabel(2, 19, { microStyle: MICRO_LABEL_STYLES.Letters }),
    "1",
  );
});

// ───────────────── Sanity ─────────────────
test("Accidental option is ignored in non-accidental styles", () => {
  assert.equal(
    buildFretLabel(1, 24, {
      microStyle: MICRO_LABEL_STYLES.Letters,
      accidental: "flat",
    }),
    "0a",
  );
});
