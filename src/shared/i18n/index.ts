// App-wide i18next setup. Import this module once, before the app renders
// (src/app/main.jsx does). Translators: see docs/translating.md.
//
// Translations are bundled rather than fetched, so every language works
// offline (the app is a PWA) and nothing suspends on first render.

import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { removeUrlSearchParams } from "@shared/lib/urlSearchParams";

import cs from "@shared/i18n/locales/cs.json";
import en from "@shared/i18n/locales/en.json";

export const LANGUAGE_STORAGE_KEY = "tv.language";
const LANGUAGE_QUERY_PARAM = "lng";

// Every language the UI offers. `label` is the language's own name, so
// people can find theirs whatever language the UI is currently in.
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "cs", label: "Čeština" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const FALLBACK_LANGUAGE: LanguageCode = "en";

const isBrowser = typeof window !== "undefined";

if (isBrowser) i18n.use(LanguageDetector);

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    cs: { translation: cs },
  },
  // Outside the browser (unit tests) there's nothing to detect: use English
  lng: isBrowser ? undefined : FALLBACK_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES.map(({ code }) => code),
  // cs-CZ -> cs, en-GB -> en
  nonExplicitSupportedLngs: true,
  load: "languageOnly",
  // An empty string in a translation file means "not translated yet", so
  // show the English text instead of nothing
  returnEmptyString: false,
  // React escapes rendered strings already
  interpolation: { escapeValue: false },
  detection: {
    // ?lng=cs wins (handy for testing translations), then the saved choice,
    // then the browser's languages
    order: ["querystring", "localStorage", "navigator"],
    lookupQuerystring: LANGUAGE_QUERY_PARAM,
    lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    caches: ["localStorage"],
  },
  react: { useSuspense: false },
  initAsync: false,
});

function syncDocumentLanguage(language: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
}

syncDocumentLanguage(i18n.resolvedLanguage ?? FALLBACK_LANGUAGE);

// ?lng= has been applied and saved by now; drop it so it doesn't end up in
// share links or look like a (broken) quickshare URL to the share loader
removeUrlSearchParams([LANGUAGE_QUERY_PARAM]);

i18n.on("languageChanged", () => {
  syncDocumentLanguage(i18n.resolvedLanguage ?? FALLBACK_LANGUAGE);
});

export default i18n;
