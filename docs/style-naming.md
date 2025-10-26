# CSS naming conventions

This project uses a BEM-flavoured naming scheme built on the `tv-` prefix. The
prefix keeps tuning-visualizer styles easy to spot and prevents conflicts with
third-party CSS.

## Blocks, elements, and modifiers

- **Blocks**: high-level UI regions or reusable atoms (e.g. `tv-shell`,
  `tv-panel`, `tv-button`, `tv-fretboard`).
- **Elements**: child parts of a block, suffixed with `__` (e.g.
  `tv-shell__header`, `tv-panel__body-inner`, `tv-fretboard__marker`).
- **Modifiers**: variants of blocks/elements, suffixed with `--` (e.g.
  `tv-panel--size-sm`, `tv-button--icon`, `tv-fretboard__string--ghost`).
- **State classes**: transient state is expressed with an `is-` prefix (e.g.
  `is-active`, `is-lefty`, `is-collapsed`).

## Utility helpers

Utility classes are prefixed with `tv-u-` and are reserved for single-purpose
concerns such as animations. For example, `tv-u-spin` applies the global spin
animation used by the loading indicator in toast notifications.

## Layout shell example

```html
<div class="tv-shell">
  <header class="tv-shell__header">
    <div class="tv-header">
      <h1 class="tv-header__title">TunningViz</h1>
      <a class="tv-header__link" href="…">Source</a>
    </div>
  </header>
  <main class="tv-shell__main">
    <div class="tv-stage">
      <div class="tv-stage__surface is-lefty">…</div>
    </div>
  </main>
  <footer class="tv-shell__controls">…</footer>
</div>
```

## Control surface example

```jsx
<section className="tv-panel tv-panel--size-sm">
  <button className="tv-panel__header">
    <span className="tv-panel__title">Display</span>
    <span className="tv-panel__icon" aria-hidden />
  </button>
  <div className="tv-panel__body">
    <div className="tv-panel__body-inner tv-controls tv-controls--display">
      <div className="tv-controls__group">
        <label className="tv-check">
          <input type="checkbox" /> Show fret numbers
        </label>
      </div>
      <div className="tv-field">
        <span className="tv-field__label">Dot size</span>
        <input type="range" />
      </div>
      <button className="tv-button tv-button--block">Reset</button>
    </div>
  </div>
</section>
```

## Fretboard visuals example

```svg
<line class="tv-fretboard__string" />
<line class="tv-fretboard__string tv-fretboard__string--ghost" />
<line class="tv-fretboard__fret tv-fretboard__fret--micro" />
<circle class="tv-fretboard__inlay" />
<text class="tv-fretboard__note tv-fretboard__note--root">C</text>
<text class="tv-fretboard__marker tv-fretboard__marker--capo">3</text>
```

## Overlay example

```jsx
<div className="tv-overlay" role="dialog">
  <div className="tv-overlay__title">Confirm reset?</div>
  <div className="tv-overlay__message">This cannot be undone.</div>
  <div className="tv-overlay__actions">
    <button className="tv-overlay__button tv-overlay__button--muted">
      Cancel
    </button>
    <button className="tv-overlay__button tv-overlay__button--accent">
      Reset
    </button>
  </div>
</div>
```

Use these patterns when naming new styles so that the class hierarchy remains
predictable and consistent throughout the UI.
