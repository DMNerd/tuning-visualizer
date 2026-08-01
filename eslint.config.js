import css from "@eslint/css";
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const bestPracticeRules = {
  eqeqeq: ["error", "smart"],
  "no-var": "error",
  "prefer-const": "error",
  "object-shorthand": "error",
  "no-console": ["warn", { allow: ["warn", "error"] }],
  "no-restricted-globals": ["error", "event", "name"],
};

export default defineConfig([
  globalIgnores(["dist", "build"]),
  { linterOptions: { reportUnusedDisableDirectives: "error" } },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    languageOptions: {
      tolerant: true,
      customSyntax: (defaultSyntax) => ({
        ...defaultSyntax,
        atrules: {
          ...defaultSyntax.atrules,
          "custom-media": {
            prelude: "<any-value>",
          },
        },
      }),
    },
    rules: {
      "css/no-duplicate-imports": "error",
    },
  },

  {
    files: ["**/*.{js,jsx}"],
    ignores: ["eslint.config.js", "vite.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.browser,
    },
    extends: [
      js.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    rules: {
      ...bestPracticeRules,
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^[A-Z_]",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // Node-run config files (build tooling, not app/browser code)
  {
    files: ["eslint.config.js", "vite.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    extends: [js.configs.recommended],
    rules: {
      ...bestPracticeRules,
      "no-console": "off",
      "no-unused-vars": [
        "error",
        { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^_" },
      ],
    },
  },

  // TypeScript / TSX (type-aware)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
        ecmaFeatures: { jsx: true },
      },
      globals: globals.browser,
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked, // strong TS rules that need type info
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    rules: {
      ...bestPracticeRules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^[A-Z_]",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-undef": "off",

      // A few helpful TS additions (tweak to taste)
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
    },
    settings: {
      react: { version: "detect" },
    },
  },
]);
