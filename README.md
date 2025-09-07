# Tuning Visualizer aka TunningViz

An interactive fretboard visualizer for exploring scales, tunings, and microtonal systems.  
Built with React

Why? Because my friend is a big [King Gizzard & the Lizard Wizard](https://kinggizzardandthelizardwizard.com/) fan and finding any resources on microtonal music is a pain...

Images of guitar scales are inconsistent or paid and finding ones you like is a equaly as painfull

This app will be free and open source forever and is completely self hostable

---

## Live Demo

[Try it here](https://tune.nrds.cz/)

![TuningViz](https://i.imgur.com/rzjoute.png "The app")

---

## Features

- **Tuning Systems**
  - Standard **12-TET** library (Major, Natural/Harmonic Minor, etc.)
  - **24-TET** microtonal scales with distinct coloring for microtonal notes
  - Theoretical support for any TET/EDO system

- **Scales & Chords**
  - Scale picker filtered by tuning system
  - **Chord Builder**: highlight chord tones on top of the selected scale
  - Select any **root** note; choose **sharps/flats**

- **Tunings**
  - Presets for **6/7/8-string guitar**, **violin family (G–D–A–E)**, and **experimental** sets (e.g., King Gizzard C#–F#–C#–F#–B–E)
  - Custom tuning presets
  - Per string tuning

- **Display**
  - Multiple label modes: **note names**, **degrees/intervals**, **fret numbers (relative to 12-TET)**, or **fret numbers**
  - Option to color the notes based on **degrees** (independently)
  - Toggle **open strings** and **fret numbers**
  - Classic **inlay markers**
  - **Light/Dark** theme with preference saved
  - Option to mirror the fretboard for lefties

- **Layout & Controls**
  - Consistent, responsive fretboard geometry across any fret/string count
  - Validated numeric inputs for frets (friendly warnings on out-of-range values)
  - **Fullscreen** viewing mode

- **Export & Print**
  - Export fretboard as **PNG** or **SVG** with any setting you desire
  - **Print** directly from the browser

Example of exported scales (microtonal, colored degrees)

![Scales](https://i.imgur.com/qE3y8SS.png "Microtonal scale example")

---

## Getting Started

### Prerequisites

- Node.js (>=18)
- pnpm or npm
- podman or docker (if containerisation is desired)

### Installation

```bash
git clone https://github.com/DMNerd/tuning-visualizer.git
cd tuning-visualizer
pnpm install
pnpm build
```

Then you can serve it with a static webserver like [sWS](https://github.com/static-web-server/static-web-server) (or use vite preview/dev functions)

## Install with Docker/Podman

You can run **Tuning Visualizer** fully containerized without installing Node or pnpm on your machine. Below are two options:

> The app is a static React site after `pnpm build`. We serve the `/dist` folder with a tiny HTTP server [sWS](https://github.com/static-web-server/static-web-server).

### Option A — `docker compose` / `podman compose` (no Dockerfile)

Docker compose is part of the repo. GHCR builds are multiarch (amd64 and arch)

Run with either tool:

```bash
# Docker
docker compose up --build

# Podman
podman compose up --build
```

Open: http://localhost:8080

---

### Option B — Production image with Dockerfile

This approach builds a compact, self-contained image that serves the static bundle with sWS.

Dockerfile is part of the repo

**1) Build the image:**

```bash
# Docker
docker build -t tuning-visualizer:latest .
# Podman
podman build -t tuning-visualizer:latest .
```

**2) Run the container:**

```bash
# Docker
docker run --rm -p 8080:80 tuning-visualizer:latest
# Podman
podman run --rm -p 8080:80 tuning-visualizer:latest
```
