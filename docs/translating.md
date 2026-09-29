# Translating TuningViz

TuningViz's interface is available in **English** and **Czech**. This guide
covers improving an existing translation and adding a new language. You don't
need to know React. You edit one JSON file per language and preview it in the
browser.

- [Where the text lives](#where-the-text-lives)
- [Previewing your changes](#previewing-your-changes)
- [Rules for editing a translation file](#rules-for-editing-a-translation-file)
- [Plurals](#plurals)
- [What is not translated (yet)](#what-is-not-translated-yet)
- [Czech glossary](#czech-glossary)
- [Adding a new language](#adding-a-new-language)
- [Checking your work](#checking-your-work)
- [For developers](#for-developers)

## Where the text lives

Every piece of interface text is in `src/shared/i18n/locales/`, one file per
language:

| File      | Language         |
| --------- | ---------------- |
| `en.json` | English (source) |
| `cs.json` | Czech (čeština)  |

English is the source language. Every other file has the same keys as
`en.json`, with the values translated. Keys are grouped by the part of the app
they belong to:

| Group                                                 | Where it appears                                        |
| ----------------------------------------------------- | ------------------------------------------------------- |
| `common`                                              | Words used everywhere (Cancel, Close, Off…)             |
| `header`                                              | Top bar: theme and language switchers                   |
| `stageHud`                                            | Buttons and badges over the fretboard                   |
| `display`                                             | Display panel                                           |
| `instrument`                                          | Instrument panel, preset picker and preset gallery      |
| `packs`                                               | Messages about custom tuning packs (toasts, validation) |
| `theory`                                              | Scale and Chord panels, including "What's this chord?"  |
| `practice`                                            | Metronome                                               |
| `training`                                            | Training routine builder and the routine overlay        |
| `export`                                              | Export / Import panel                                   |
| `manager`                                             | "Manage custom tunings" window                          |
| `editor`                                              | Custom pack JSON editor and its helper panel            |
| `share`                                               | Quickshare window                                       |
| `hotkeys`                                             | Keyboard shortcut cheatsheet (press F1)                 |
| `errorFallback`, `resets`, `numberField`, `fretboard` | Errors, reset dialogs, number inputs, empty fretboard   |

Keys ending in `Aria` (and some others) are never shown on screen: screen
readers read them aloud. Translate them like any other text.

## Previewing your changes

**Check your wording in the running app, not just in the JSON file.** A
translation that reads well on its own can be too long for a button, sound
wrong next to the control it labels, or use the wrong plural form. The
reliable way to catch this is to run the development server and click through
the app while you translate.

1. Install [Node.js](https://nodejs.org/) and
   [pnpm](https://pnpm.io/installation), then set up the project once:

   ```sh
   pnpm install
   ```

2. Start the development server and leave it running:

   ```sh
   pnpm dev
   ```

3. Open the address it prints, adding `?lng=` and your language code, for
   example `http://localhost:5173/?lng=cs`. You can also pick the language
   from the globe menu in the top bar. The app remembers the choice in your
   browser.
4. Keep the translation file and the browser side by side. Each time you save
   the file, the page reloads with your changes.

While you click through, check the places that are easy to miss:

- **Every panel, and both sides of every switch.** Some text only appears
  when an option is on. For example, "Independent of scale" appears only
  after choosing "Chord tones only".
- **Windows:** the preset gallery, custom pack editor (including its helper
  panel), "Manage custom tunings", Quickshare and the training routine
  builder.
- **Messages:** notifications appear in the top-right corner after actions
  such as saving, exporting or copying a link. Confirmation dialogs appear
  when you delete something or reset settings.
- **Tooltips:** hover over icon buttons (the reset and fullscreen buttons
  over the fretboard, the shuffle button next to the scale).
- **Keyboard shortcuts:** press F1.
- **Plurals:** change the numbers to see each form. In Czech, set strings to
  4 and then 6 to see "4 struny" and "6 strun", and set "Bars per scale" to
  1, 3 and 5 with auto-advance on.
- **Narrow screens:** make the browser window narrow, or use your browser's
  phone view, to check that long words still fit their buttons.

Without a saved choice, the app follows the browser's language settings and
falls back to English.

## Rules for editing a translation file

**Change only the text to the right of the colon.** Keep keys, quotes, commas
and braces exactly as they are:

```json
"close": "Zavřít",
```

**Keep placeholders in double curly braces.** `{{name}}` and `{{count}}` are
replaced by the app. Don't translate or rename them. You may move them within
the sentence:

```json
"en": "Removing {{name}}…",
"cs": "Odstraňování: {{name}}…"
```

**Keep tags.** A few texts contain markup: `<strong>…</strong>`,
`<code>…</code>` and the self-closing `<markers/>`. Keep every tag and translate
only the text around it. Don't translate what's inside `<code>` (JSON field
names such as `meta.board` must stay as they are):

```json
"stringMetaIntro": "Volitelné položky <code>meta.stringMeta</code> určují vzhled jednotlivých strun."
```

**Leave a text empty to fall back to English.** `""` means "not translated
yet", and the app shows the English text instead. Use this when you're unsure,
rather than guessing.

**Match the app's tone.** Short, plain, sentence case, with no exclamation
marks. Button labels are verbs ("Uložit balíček"), and headings are nouns.

**Describe what a switch does; don't tell the user to turn it on.** Turning
it on is implied, so the help text under a switch explains the effect. Write
"Základní tóny akordů se pojmenují jako hmaty vůči kapodastru.", not "Zapněte
pro pojmenování…".

**Use typographic characters.** The English uses `…` (one character), `–` for
ranges and `→` for arrows. Use your language's own quotation marks: Czech uses
„takhle“.

**Escape double quotes inside a text.** Write `\"` for a straight quote that
is part of the text (or use typographic quotes, which need no escaping).

## Plurals

Texts that depend on a number come in several forms, one per grammatical
case, with a suffix after the key name. The app picks the form using the
language's plural rules (from the browser's
[`Intl.PluralRules`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/PluralRules)).

English has two forms:

```json
"stringCount_one": "{{count}} string",
"stringCount_other": "{{count}} strings"
```

Czech has four:

| Suffix   | Used for        | Example    |
| -------- | --------------- | ---------- |
| `_one`   | 1               | 1 struna   |
| `_few`   | 2, 3, 4         | 3 struny   |
| `_many`  | fractions (1,5) | 1,5 struny |
| `_other` | 0, 5 and more   | 6 strun    |

```json
"stringCount_one": "{{count}} struna",
"stringCount_few": "{{count}} struny",
"stringCount_many": "{{count}} struny",
"stringCount_other": "{{count}} strun"
```

Each language needs exactly the forms its rules define. The checks below tell
you if one is missing. The [Unicode plural rules
table](https://www.unicode.org/cldr/charts/latest/supplemental/language_plural_rules.html)
lists the forms for every language.

**Ordinal numbers** (1st, 2nd…) use `_ordinal_` suffixes. English needs four
forms, while Czech writes every ordinal as a number and a full stop, so it has
only one:

```json
"ordinal_ordinal_other": "{{count}}."
```

## What is not translated (yet)

These stay in English (or as-is) in every language for now:

- **Scale, chord and preset names** such as "Major (Ionian)", "Maj7 (1 3 5 7)"
  and "Drop D". The app also uses these names internally to identify what's
  selected, so translating them needs code changes first. The two built-in
  presets, "Factory default" and "Saved default", are the exception: they're
  in `instrument.presetFactoryDefault` and `instrument.presetSavedDefault`.
- **Note names.** Users choose international (B) or German/Czech (H/B) naming
  in the Display panel, independently of the interface language.
- **Tuning system names** (12-TET, 24-TET), interval names (P5, m3), time
  signatures and units (BPM, MB).
- **The product name**, TuningViz.
- **Custom pack JSON** field names and values, which are part of the file
  format.

## Czech glossary

Terms used in `cs.json`, for consistency:

| English          | Czech            |
| ---------------- | ---------------- |
| fretboard        | hmatník          |
| fret             | pražec           |
| fretless         | bezpražcový      |
| string           | struna           |
| open string      | prázdná struna   |
| capo             | kapodastr        |
| chord shape      | hmat             |
| scale            | stupnice         |
| root             | základní tón     |
| key              | tónina           |
| degree           | stupeň           |
| tonic            | tónika           |
| sharps / flats   | křížky / béčka   |
| accidentals      | posuvky          |
| tuning           | ladění           |
| tuning system    | ladicí systém    |
| preset           | předvolba        |
| (tuning) pack    | balíček (ladění) |
| bar / beat       | takt / doba      |
| time signature   | takt             |
| subdivision      | dělení doby      |
| count-in         | předtaktí        |
| tap tempo        | vyťukat tempo    |
| training routine | tréninkový plán  |
| quickshare       | rychlé sdílení   |

Address the user politely in the plural ("Zvolte stupnici"), as most Czech
software does.

> The initial Czech translation was machine-assisted. Corrections from native
> speakers are very welcome, especially for music terminology.

## Adding a new language

1. Copy `src/shared/i18n/locales/en.json` to a file named after the language's
   [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes), for
   example `de.json`.
2. Translate the values, following the rules above. Replace the English plural
   and ordinal forms with the ones your language needs. You can leave texts
   empty (`""`) and translate them later.
3. Register the language in `src/shared/i18n/index.ts`: import the file, add it
   to `resources`, and add it to `SUPPORTED_LANGUAGES` with its name written
   in that language (for example `{ code: "de", label: "Deutsch" }`).
4. Run the checks below.

If you're not comfortable with step 3, open a pull request or an issue with
just the JSON file, and a maintainer will wire it up.

## Checking your work

The automated checks catch structural mistakes, but they can't tell whether a
translation reads well. Review the wording in the running app first (see
[Previewing your changes](#previewing-your-changes)), then run:

```sh
pnpm test
```

The translation checks live in `src/tests/shared/i18nLocales.test.js`. They
fail when:

| Failure                                             | What to do                                                                                    |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `has exactly the English keys`: `missing` / `extra` | Add the missing keys, or remove keys that aren't in `en.json` (often a typo in a key name).   |
| `plural keys have every form the language needs`    | Add the listed plural forms (see [Plurals](#plurals)).                                        |
| `keeps the English placeholders and tags`           | A `{{placeholder}}` or tag was renamed, translated or dropped. Copy it from the English text. |

`pnpm format:check` checks that the JSON is formatted consistently, and
`pnpm format` fixes the formatting.

## For developers

The app uses [i18next](https://www.i18next.com/) with
[react-i18next](https://react.i18next.com/). The setup is in
`src/shared/i18n/index.ts`, which `src/app/main.jsx` imports before the app
renders. Translations are bundled rather than fetched, so every language works
offline and nothing suspends on first render.

- **In components**, use the hook. Components then re-render when the language
  changes, even behind `memo`:

  ```jsx
  const { t } = useTranslation();
  return <button>{t("common.close")}</button>;
  ```

- **For text with markup**, use `<Trans>` with named tags, so translators can
  move the markup around:

  ```jsx
  <Trans i18nKey="editor.ruleName" components={{ strong: <strong /> }} />
  ```

- **Outside React** (toasts, confirm dialogs, validation messages), call
  `i18n.t` from `@shared/i18n` at the moment the text is needed, never at
  module load time.
- **Models and pure functions** that build text take a `t` argument that
  defaults to `i18n.t`. Hooks pass the `t` from `useTranslation()` and list it
  in their `useMemo`/`useCallback` dependencies, so memoized text updates on a
  language change.
- **Stored values stay in English.** When a value is persisted or used as an
  identifier (subdivision names, built-in preset names, option values), keep
  the value and translate only its label. Model data can carry a `labelKey`
  that components render with `t(labelKey)`.
- **Key names** are `group.camelCase`. Plurals use i18next's suffixes (`_one`,
  `_other`, …) and are called with `{ count }`.
- **Every key must be written out literally** somewhere in `src/` (for example
  in a `{ value: "Quarter", labelKey: "practice.subdivisionQuarter" }` map, not
  built with string concatenation). The locale test checks that every used key
  exists and every key is used.
- **Lint:** `eslint-plugin-i18next` rejects plain text in JSX (`i18next/no-literal-string`).
  Put non-translatable text such as the product name in a constant.
- **Tests** run in Node, where the setup pins English, so tests can assert on
  English strings. A test that renders components should `import "@shared/i18n"`.
