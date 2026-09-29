// Guards the translation files (src/shared/i18n/locales). See
// docs/translating.md for the rules these checks enforce.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { SUPPORTED_LANGUAGES } from "@shared/i18n";

const root = join(import.meta.dirname, "../../..");
const localesDir = join(root, "src/shared/i18n/locales");
const loadLocale = (code) =>
  JSON.parse(readFileSync(join(localesDir, `${code}.json`), "utf-8"));

const PLURAL_SUFFIX = /_(ordinal_)?(zero|one|two|few|many|other)$/;

// { "ns.key": { forms: { one: "…", other: "…" } | null, ordinal, text } }
function flatten(tree, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      flatten(value, path, out);
      continue;
    }
    const match = path.match(PLURAL_SUFFIX);
    const base = match ? path.slice(0, -match[0].length) : path;
    out[base] ??= { forms: match ? {} : null, ordinal: false, texts: [] };
    if (match) {
      out[base].forms[match[2]] = value;
      out[base].ordinal = Boolean(match[1]);
    }
    out[base].texts.push(value);
  }
  return out;
}

const placeholders = (texts) =>
  [...new Set(texts.flatMap((s) => s.match(/{{\s*[\w.]+\s*}}|<\/?\w+\/?>/g)))]
    .filter(Boolean)
    .map((s) => s.replace(/\s/g, ""))
    .sort();

const english = flatten(loadLocale("en"));

for (const { code } of SUPPORTED_LANGUAGES) {
  const locale = flatten(loadLocale(code));

  test(`${code}: has exactly the English keys`, () => {
    const missing = Object.keys(english).filter((k) => !(k in locale));
    const extra = Object.keys(locale).filter((k) => !(k in english));
    assert.deepEqual({ missing, extra }, { missing: [], extra: [] });
  });

  test(`${code}: plural keys have every form the language needs`, () => {
    const problems = [];
    for (const [key, entry] of Object.entries(locale)) {
      if (!entry.forms) continue;
      const type = entry.ordinal ? "ordinal" : "cardinal";
      const needed = new Intl.PluralRules(code, { type }).resolvedOptions()
        .pluralCategories;
      const missing = needed.filter((form) => !(form in entry.forms));
      if (missing.length) problems.push(`${key}: missing ${missing}`);
    }
    assert.deepEqual(problems, []);
  });

  test(`${code}: keeps the English placeholders and tags`, () => {
    const problems = [];
    for (const [key, entry] of Object.entries(locale)) {
      if (!english[key]) continue;
      // Empty means "not translated yet" and falls back to English
      const texts = entry.texts.filter((s) => s !== "");
      if (!texts.length) continue;
      const expected = placeholders(english[key].texts);
      const actual = placeholders(texts);
      if (expected.join() !== actual.join()) {
        problems.push(`${key}: expected ${expected} but got ${actual}`);
      }
    }
    assert.deepEqual(problems, []);
  });
}

// Every "namespace.key" string literal in the source should be a real key,
// and every key should be used somewhere
function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "tests" ? [] : sourceFiles(path);
    }
    return /\.(jsx?|tsx?)$/.test(entry.name) ? [path] : [];
  });
}

// Literals that look like keys but aren't (file names, state paths)
const NOT_TRANSLATION_KEYS = new Set([
  "fretboard.png",
  "fretboard.svg",
  "instrument.customTunings",
]);

const namespaces = Object.keys(loadLocale("en")).join("|");
const keyLiteral = new RegExp(`["'\`]((?:${namespaces})\\.\\w+)["'\`]`, "g");
const usedKeys = new Map();
for (const file of sourceFiles(join(root, "src"))) {
  for (const [, key] of readFileSync(file, "utf-8").matchAll(keyLiteral)) {
    if (!NOT_TRANSLATION_KEYS.has(key)) usedKeys.set(key, relative(root, file));
  }
}

test("every translation key used in the source exists", () => {
  const unknown = [...usedKeys]
    .filter(([key]) => !(key in english))
    .map(([key, file]) => `${key} (${file})`);
  assert.deepEqual(unknown, []);
});

test("every translation key is used in the source", () => {
  const unused = Object.keys(english).filter((key) => !usedKeys.has(key));
  assert.deepEqual(unused, []);
});
