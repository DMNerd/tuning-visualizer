// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import css from "@eslint/css";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig([
  globalIgnores(["dist"]),

  // JavaScript / JSX
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: globals.browser,
    },
    extends: [
      js.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
    },
  },

  // TypeScript / TSX (type-aware)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        projectService: true,
        tsconfigRootDir: __dirname,
      },
      globals: globals.browser,
    },
    plugins: { "@typescript-eslint": tseslint.plugin },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { varsIgnorePattern: "^[A-Z_]" },
      ],
      "no-undef": "off",
    },
  },

  // CSS (Lightning CSS will transform these; ESLint lints them)
  {
    files: ["**/*.css"],
    language: "css/css",
    plugins: { css },
    // You can also use: extends: ["css/recommended"]
    rules: {
      "css/no-empty-blocks": "error",
      "css/no-invalid-at-rules": "error",
      "css/no-invalid-properties": "error",
      // Baseline feature check (good complement to Lightning CSS targets)
      "css/use-baseline": "warn",
      // Optional: forbid !important in your app styles
      "css/no-important": "warn",
    },
  },
]);
