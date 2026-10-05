# Project Structure

The source tree is organized by product feature/domain rather than by technical type.

## Top-level source areas

- `src/app/` contains application composition only: bootstrapping, global providers, app-level orchestration hooks, and shell/layout components.
- `src/features/*/` contains feature-owned UI, hooks, models, containers, and stores. Public feature APIs are exposed through each feature's `index.js` barrel.
- `src/shared/` contains reusable feature-agnostic UI primitives, hooks, libraries, and configuration. `src/shared/i18n/` holds the i18next setup and the translation files (`locales/*.json`); see [translating.md](translating.md).
- `src/domain/` contains pure domain data and music-theory/preset/meta modules that do not depend on React app wiring.
- `src/tests/` mirrors this organization with `features/`, `domain/`, `shared/`, and `app/` folders.

## Import aliases

Use scoped aliases for ownership boundaries:

- `@app/*` for app composition, providers, and shell code.
- `@features/*` for feature public barrels and intentional feature-internal imports.
- `@shared/*` for feature-agnostic UI, hooks, helpers, and config.
- `@domain/*` for pure domain modules.
- `@styles/*` for global styles.
- `@/*` remains available as a compatibility fallback, but new imports should prefer the scoped aliases above.

## Import boundary rules

- `src/features/*` may import from `src/shared/*` and `src/domain/*`.
- `src/app/*` may import from feature public entry points such as `@features/instrument` instead of feature internals where possible.
- Feature internals must not import from `src/app/*`.
- Feature internals should avoid importing another feature's internal files; use the other feature's `index.js` when a dependency is intentional.
- `src/shared/*` should remain feature-agnostic. If a shared helper must coordinate app-wide stores, keep the dependency isolated and document it in review.

- Music theory (note names, interval and chord sizes, chord detection, scale
  formulas) comes from the microtonal fork of Tonal, and only through
  `src/domain/theory/tonalAdapter.ts`. The adapter converts between gv's
  integer pitch classes (`0..N-1`) and the fork's spelled names; nothing else
  imports `@dmnerd/microtonal` (ESLint `no-restricted-imports` enforces this).
  The fork is an ordinary npm dependency; to pick up fork changes, release a
  new version of it and bump the version in `package.json`.
  See [microtonal-migration-plan.md](microtonal-migration-plan.md).

The other boundaries are enforced during code review rather than by an ESLint boundary plugin.
