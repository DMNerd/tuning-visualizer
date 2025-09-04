# Tuning Visualizer

An interactive fretboard visualizer for exploring scales, tunings, and microtonal systems.  
Built with React

---

## Live Demo

[Try it here](https://tune.nrds.cz/)

---

## Features

* **Tuning Systems**

  * Standard **12-TET** library (Major, Natural/Harmonic Minor, etc.)
  * **24-TET** microtonal scales with distinct coloring for microtonal notes

* **Scales & Chords**

  * Scale picker filtered by tuning system
  * **Chord Builder**: highlight chord tones on top of the selected scale
  * Select any **root** note; choose **sharps/flats**

* **Tunings**

  * Presets for **6/7/8-string guitar**, **violin family (G–D–A–E)**, and **experimental** sets (e.g., King Gizzard C#–F#–C#–F#–B–E)
  * Custom tuning presets

* **Display**

  * Multiple label modes: **note names**, **degrees/intervals**, or **fret numbers**
  * Toggle **open strings** and **fret numbers**
  * Classic **inlay markers**
  * **Light/Dark** theme with preference saved

* **Layout & Controls**

  * Consistent, responsive fretboard geometry across any fret/string count
  * Validated numeric inputs for frets (friendly warnings on out-of-range values)
  * **Fullscreen** viewing mode

* **Export & Print**

  * Export fretboard as **PNG** or **SVG**
  * **Print** directly from the browser

---

## Getting Started

### Prerequisites

- Node.js (>=18)
- pnpm or npm

### Installation

```bash
git clone https://github.com/DMNerd/tuning-visualizer.git
cd tuning-visualizer
pnpm install
```
