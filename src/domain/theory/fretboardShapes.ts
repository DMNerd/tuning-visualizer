export type RootLocation = {
  string: number;
  fret: number;
};

export type ShapeNote = {
  string: number;
  fret: number;
  pc: number;
  degree: number;
  isRoot: boolean;
};

export type ShapeSummary = {
  fretSpan: [number, number];
  stringSpan: [number, number];
  degreeCoverage: number[];
  rootLocations: RootLocation[];
};

export type Shape = {
  notes: ShapeNote[];
  canonicalTemplate: Array<[number, number, number]>;
  templateId: string;
  summary: ShapeSummary;
};

export type ShapeOccurrence = {
  occurrenceId: string;
  startFret: number;
  endFret: number;
  templateId: string;
  notes: ShapeNote[];
};
export type ShapeAdjacencyFn = (a: ShapeNote, b: ShapeNote) => boolean;

export type PitchClassMode = "relative" | "absolute";

export type BuildFretboardMapInput = {
  n: number;
  tuning: number[];
  pcs: number[] | Set<number>;
  rootPc?: number;
  pcsMode?: PitchClassMode;
  fretMin: number;
  fretMax: number;
  rootLocation?: RootLocation;
  rootLocationMode?: "require-match" | "infer-from-location";
};

export type ConnectedComponentOptions = {
  maxStringStep?: number;
  maxFretStep?: number;
  fretMin?: number;
  fretMax?: number;
};

export type AnchorShapeOptions = {
  anchor: RootLocation;
  maxStringDistance: number;
  maxFretDistance: number;
};

export type WindowShapeOptions = {
  startFret: number;
  width: number;
};

export function mod(value: number, n: number): number {
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error("n must be a positive integer");
  }

  return ((value % n) + n) % n;
}

export function normalizePitchClasses(
  values: Iterable<number>,
  n: number,
): number[] {
  const asArray = Array.from(values);
  for (const value of asArray) {
    if (!Number.isInteger(value)) {
      throw new Error("pitch-class values must be integers");
    }
  }
  return [...new Set(asArray.map((value) => mod(value, n)))].sort(
    (a, b) => a - b,
  );
}

export function toRelativePitchClasses(
  pcsAbsolute: Iterable<number>,
  rootPc: number,
  n: number,
): number[] {
  const normalizedRootPc = mod(rootPc, n);
  const offsets = Array.from(pcsAbsolute, (pc) =>
    mod(pc - normalizedRootPc, n),
  );
  return normalizePitchClasses(offsets, n);
}

export function pcAt(stringPc: number, fret: number, n: number): number {
  return mod(stringPc + fret, n);
}

export function degreeAt(pc: number, rootPc: number, n: number): number {
  return mod(pc - rootPc, n);
}

export function propagateFret(
  fretOnStringI: number,
  stringI: number,
  stringJ: number,
  tuning: readonly number[],
  n: number,
): number {
  return propagateFretClass(fretOnStringI, stringI, stringJ, tuning, n);
}

export function propagateFretClass(
  fretOnStringI: number,
  stringI: number,
  stringJ: number,
  tuning: readonly number[],
  n: number,
): number {
  const delta = mod(tuning[stringJ] - tuning[stringI], n);
  return mod(fretOnStringI - delta, n);
}

export function propagateFretToRange(
  fretOnStringI: number,
  stringI: number,
  stringJ: number,
  tuning: readonly number[],
  n: number,
  fretMin: number,
  fretMax: number,
): number[] {
  if (!Number.isInteger(fretOnStringI)) {
    throw new Error("fretOnStringI must be an integer");
  }
  if (
    !Number.isInteger(fretMin) ||
    !Number.isInteger(fretMax) ||
    fretMax < fretMin
  ) {
    throw new Error("Invalid fret range");
  }

  const delta = mod(tuning[stringJ] - tuning[stringI], n);
  const base = fretOnStringI - delta;
  const out: number[] = [];

  const kMin = Math.ceil((fretMin - base) / n);
  const kMax = Math.floor((fretMax - base) / n);

  for (let k = kMin; k <= kMax; k += 1) {
    out.push(base + k * n);
  }

  return out;
}

export function buildFretboardMap(input: BuildFretboardMapInput): ShapeNote[] {
  const {
    n,
    fretMin,
    fretMax,
    pcs,
    tuning,
    pcsMode = "relative",
    rootLocation,
    rootLocationMode = "require-match",
  } = input;

  if (
    !Number.isInteger(fretMin) ||
    !Number.isInteger(fretMax) ||
    fretMax < fretMin
  ) {
    throw new Error("Invalid fret range");
  }
  if (typeof input.rootPc === "number" && !Number.isInteger(input.rootPc)) {
    throw new Error("rootPc must be an integer");
  }

  if (tuning.length === 0) {
    return [];
  }
  for (const pitch of tuning) {
    if (!Number.isInteger(pitch)) {
      throw new Error("tuning values must be integers");
    }
  }

  const normalizedTuning = tuning.map((pc) => mod(pc, n));

  if (rootLocation) {
    const inBounds =
      rootLocation.string >= 0 && rootLocation.string < normalizedTuning.length;
    if (!inBounds) {
      throw new Error("rootLocation.string is out of range");
    }
    if (!Number.isInteger(rootLocation.fret)) {
      throw new Error("rootLocation.fret must be an integer");
    }
  }

  const anchorPc = rootLocation
    ? pcAt(normalizedTuning[rootLocation.string], rootLocation.fret, n)
    : undefined;

  let resolvedRootPc =
    typeof input.rootPc === "number" ? mod(input.rootPc, n) : undefined;

  if (rootLocationMode === "infer-from-location" && anchorPc != null) {
    resolvedRootPc = anchorPc;
  }

  if (resolvedRootPc == null) {
    throw new Error(
      "rootPc is required unless it can be inferred from rootLocation",
    );
  }

  if (
    rootLocationMode === "require-match" &&
    anchorPc != null &&
    anchorPc !== resolvedRootPc
  ) {
    throw new Error("rootLocation does not match the selected rootPc");
  }

  const relativePcs =
    pcsMode === "absolute"
      ? toRelativePitchClasses(pcs, resolvedRootPc, n)
      : normalizePitchClasses(pcs, n);

  const pcsSet = new Set(relativePcs);
  const notes: ShapeNote[] = [];

  for (let string = 0; string < normalizedTuning.length; string += 1) {
    const openPc = normalizedTuning[string];

    for (let fret = fretMin; fret <= fretMax; fret += 1) {
      const pc = pcAt(openPc, fret, n);
      const degree = degreeAt(pc, resolvedRootPc, n);

      if (!pcsSet.has(degree)) {
        continue;
      }

      notes.push({
        string,
        fret,
        pc,
        degree,
        isRoot: degree === 0,
      });
    }
  }

  return notes;
}

export function extractWindowShape(
  notes: readonly ShapeNote[],
  options: WindowShapeOptions,
): ShapeNote[] {
  if (!Number.isInteger(options.width) || options.width < 1) {
    throw new Error("width must be a positive integer");
  }
  const maxFret = options.startFret + options.width - 1;
  return notes.filter(
    (note) => note.fret >= options.startFret && note.fret <= maxFret,
  );
}

export function extractAnchorCenteredShape(
  notes: readonly ShapeNote[],
  options: AnchorShapeOptions,
): ShapeNote[] {
  const { anchor, maxFretDistance, maxStringDistance } = options;

  return notes.filter(
    (note) =>
      Math.abs(note.fret - anchor.fret) <= maxFretDistance &&
      Math.abs(note.string - anchor.string) <= maxStringDistance,
  );
}

export function extractConnectedComponentShapes(
  notes: readonly ShapeNote[],
  options: ConnectedComponentOptions = {},
): ShapeNote[][] {
  const { maxStringStep = 1, maxFretStep = 2, fretMin, fretMax } = options;
  return extractConnectedComponentShapesWithAdjacency(
    notes,
    makeRectAdjacency({ maxStringStep, maxFretStep }),
    { fretMin, fretMax },
  );
}

export function makeRectAdjacency({
  maxStringStep = 1,
  maxFretStep = 2,
}: {
  maxStringStep?: number;
  maxFretStep?: number;
} = {}): ShapeAdjacencyFn {
  return (a, b) =>
    Math.abs(a.string - b.string) <= maxStringStep &&
    Math.abs(a.fret - b.fret) <= maxFretStep;
}

export function extractConnectedComponentShapesWithAdjacency(
  notes: readonly ShapeNote[],
  areAdjacent: ShapeAdjacencyFn,
  options: { fretMin?: number; fretMax?: number } = {},
): ShapeNote[][] {
  const { fretMin, fretMax } = options;
  const filtered = notes.filter((note) => {
    if (fretMin != null && note.fret < fretMin) return false;
    if (fretMax != null && note.fret > fretMax) return false;
    return true;
  });

  const adjacency = new Map<number, number[]>();

  for (let i = 0; i < filtered.length; i += 1) {
    adjacency.set(i, []);
  }

  for (let i = 0; i < filtered.length; i += 1) {
    for (let j = i + 1; j < filtered.length; j += 1) {
      const a = filtered[i];
      const b = filtered[j];
      if (!areAdjacent(a, b)) continue;

      adjacency.get(i)?.push(j);
      adjacency.get(j)?.push(i);
    }
  }

  const visited = new Set<number>();
  const components: ShapeNote[][] = [];

  for (let i = 0; i < filtered.length; i += 1) {
    if (visited.has(i)) continue;

    const stack = [i];
    const component: ShapeNote[] = [];

    while (stack.length > 0) {
      const index = stack.pop();
      if (index == null || visited.has(index)) continue;

      visited.add(index);
      component.push(filtered[index]);

      for (const neighbor of adjacency.get(index) ?? []) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }

    component.sort((a, b) => a.string - b.string || a.fret - b.fret);
    components.push(component);
  }

  return components;
}

export function canonicalizeShape(
  shape: readonly ShapeNote[],
  options: { normalizeString?: boolean; normalizeFret?: boolean } = {},
): Array<[number, number, number]> {
  if (shape.length === 0) return [];

  const minFret =
    options.normalizeFret === false
      ? 0
      : Math.min(...shape.map((note) => note.fret));
  const minString =
    options.normalizeString === false
      ? 0
      : Math.min(...shape.map((note) => note.string));

  return shape
    .map(
      (note) =>
        [note.string - minString, note.fret - minFret, note.degree] as [
          number,
          number,
          number,
        ],
    )
    .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
}

export function summarizeShape(shape: readonly ShapeNote[]): ShapeSummary {
  if (shape.length === 0) {
    return {
      fretSpan: [0, 0],
      stringSpan: [0, 0],
      degreeCoverage: [],
      rootLocations: [],
    };
  }

  const frets = shape.map((note) => note.fret);
  const strings = shape.map((note) => note.string);

  return {
    fretSpan: [Math.min(...frets), Math.max(...frets)],
    stringSpan: [Math.min(...strings), Math.max(...strings)],
    degreeCoverage: [...new Set(shape.map((note) => note.degree))].sort(
      (a, b) => a - b,
    ),
    rootLocations: shape
      .filter((note) => note.isRoot)
      .map((note) => ({ string: note.string, fret: note.fret })),
  };
}

export function buildShape(shapeNotes: readonly ShapeNote[]): Shape {
  const canonicalTemplate = canonicalizeShape(shapeNotes);
  return {
    notes: [...shapeNotes],
    canonicalTemplate,
    templateId: JSON.stringify(canonicalTemplate),
    summary: summarizeShape(shapeNotes),
  };
}

export function dedupeShapesByTemplate(
  shapes: readonly (readonly ShapeNote[])[],
): Shape[] {
  const deduped = new Map<string, Shape>();

  for (const candidate of shapes) {
    if (candidate.length === 0) continue;

    const shape = buildShape(candidate);
    if (!deduped.has(shape.templateId)) {
      deduped.set(shape.templateId, shape);
    }
  }

  return [...deduped.values()];
}

export function findDistinctWindowShapeOccurrences(
  notes: readonly ShapeNote[],
  options: {
    fretMin: number;
    fretMax: number;
    width: number;
    minNotes?: number;
    requireRoot?: boolean;
  },
): {
  templates: Shape[];
  occurrences: ShapeOccurrence[];
} {
  const {
    fretMin,
    fretMax,
    width,
    minNotes = 1,
    requireRoot = false,
  } = options;
  if (!Number.isInteger(width) || width < 1) {
    throw new Error("width must be a positive integer");
  }

  const occurrences: ShapeOccurrence[] = [];

  for (
    let startFret = fretMin;
    startFret + width - 1 <= fretMax;
    startFret += 1
  ) {
    const windowNotes = extractWindowShape(notes, { startFret, width });
    if (windowNotes.length < minNotes) continue;
    if (requireRoot && !windowNotes.some((note) => note.isRoot)) continue;

    const canonicalTemplate = canonicalizeShape(windowNotes);
    const templateId = JSON.stringify(canonicalTemplate);
    occurrences.push({
      occurrenceId: `${startFret}:${templateId}`,
      startFret,
      endFret: startFret + width,
      templateId,
      notes: windowNotes,
    });
  }

  const templates = dedupeShapesByTemplate(occurrences.map((occ) => occ.notes));
  return { templates, occurrences };
}
