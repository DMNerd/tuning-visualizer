import {
  buildFretboardMap,
  buildShape,
  dedupeShapesByTemplate,
  extractConnectedComponentShapes,
  extractWindowShape,
  mod,
  normalizePitchClasses,
  toRelativePitchClasses,
  type BuildFretboardMapInput,
  type ConnectedComponentOptions,
  type PitchClassMode,
  type Shape,
  type ShapeNote,
  type ShapeOccurrence,
  summarizeShape,
} from "@domain/theory/fretboardShapes";

export type NotesPerStringConstraint =
  | { kind: "exact"; value: number; includeEmptyStrings?: boolean }
  | {
      kind: "min-max";
      min?: number;
      max?: number;
      includeEmptyStrings?: boolean;
    };

export type DegreeCoverageConstraint =
  { kind: "all-degrees" } | { kind: "at-least"; count: number };

export type ExtractionStrategy =
  | { kind: "window"; width: number }
  | {
      kind: "connected";
      maxStringStep?: number;
      maxFretStep?: number;
    }
  | {
      kind: "hybrid";
      width: number;
      maxStringStep?: number;
      maxFretStep?: number;
    };

export type ShapeSystemSpec = {
  systemId: string;
  pitchClassSet: number[] | Set<number>;
  pcsMode?: "relative" | "absolute";
  requireRoot?: boolean;
  maxFretSpan?: number;
  maxStringSpan?: number;
  notesPerString?: NotesPerStringConstraint;
  degreeCoverage?: DegreeCoverageConstraint;
  contiguousStringsOnly?: boolean;
  minNotes?: number;
  maxNotes?: number;
  extractionStrategy?: ExtractionStrategy;
  chordAnchor?: ChordAnchorSpec;
};

export type ChordAnchorSpec = {
  chordPitchClassSet: number[] | Set<number>;
  chordPcsMode?: PitchClassMode;
  minChordToneCount?: number;
  requireChordRoot?: boolean;
  maxChordFretSpan?: number;
  maxChordStringSpan?: number;
  chordExtractionStrategy?: ExtractionStrategy;
  neighborhoodFretRadius?: number;
  neighborhoodStringRadius?: number;
};

export const CHORD_PRESETS = {
  majorTriad: [0, 4, 7],
  minorTriad: [0, 3, 7],
  dominantSeventh: [0, 4, 7, 10],
} as const;

export type GenerateShapeFamilyInput = {
  fretboardInput: Omit<BuildFretboardMapInput, "pcs" | "pcsMode">;
  systemSpec: ShapeSystemSpec;
  search?: { fretMin?: number; fretMax?: number };
};

export type ShapeFamilyResult = {
  systemId: string;
  templates: Shape[];
  occurrences: ShapeOccurrence[];
  templateToOccurrences: Record<string, ShapeOccurrence[]>;
};

function uniqueSorted(values: Iterable<number>): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

export function resolveRelativePitchClassSet(params: {
  n: number;
  pcs: number[] | Set<number>;
  pcsMode?: PitchClassMode;
  rootPc?: number;
  rootLocation?: { string: number; fret: number };
  tuning?: readonly number[];
}): number[] {
  const { n, pcs, pcsMode = "relative", rootPc, rootLocation, tuning } = params;
  if (pcsMode === "absolute") {
    let resolvedRootPc = rootPc;
    if (
      resolvedRootPc == null &&
      rootLocation &&
      tuning &&
      tuning[rootLocation.string] != null
    ) {
      resolvedRootPc = mod(tuning[rootLocation.string] + rootLocation.fret, n);
    }
    if (resolvedRootPc == null) {
      throw new Error(
        "rootPc is required to resolve absolute pitch-class coverage",
      );
    }
    return toRelativePitchClasses(pcs, resolvedRootPc, n);
  }
  return normalizePitchClasses(pcs, n);
}

export function getNotesPerString(
  shape: readonly ShapeNote[],
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const note of shape) {
    counts.set(note.string, (counts.get(note.string) ?? 0) + 1);
  }
  return counts;
}

export function shapeHasRoot(shape: readonly ShapeNote[]): boolean {
  return shape.some((note) => note.isRoot);
}

export function shapeFretSpan(shape: readonly ShapeNote[]): number {
  if (shape.length === 0) return 0;
  const frets = shape.map((note) => note.fret);
  return Math.max(...frets) - Math.min(...frets);
}

export function shapeStringSpan(shape: readonly ShapeNote[]): number {
  if (shape.length === 0) return 0;
  const strings = shape.map((note) => note.string);
  return Math.max(...strings) - Math.min(...strings);
}

export function shapeHasContiguousStrings(
  shape: readonly ShapeNote[],
): boolean {
  const strings = uniqueSorted(shape.map((note) => note.string));
  if (strings.length <= 1) return true;
  for (let i = 1; i < strings.length; i += 1) {
    if (strings[i] - strings[i - 1] !== 1) return false;
  }
  return true;
}

export function shapeDegreeCoverage(
  shape: readonly ShapeNote[],
  pcs: Iterable<number>,
): { covered: number; total: number; degrees: number[] } {
  const target = uniqueSorted(pcs);
  const seen = new Set(shape.map((note) => note.degree));
  const degrees = target.filter((degree) => seen.has(degree));
  return { covered: degrees.length, total: target.length, degrees };
}

export function shapeContainsMinChordTones(
  shape: readonly ShapeNote[],
  minCount: number,
): boolean {
  return shape.length >= minCount;
}

export function shapeContainsChordRoot(shape: readonly ShapeNote[]): boolean {
  return shapeHasRoot(shape);
}

export function mergeShapeNotes(
  a: readonly ShapeNote[],
  b: readonly ShapeNote[],
): ShapeNote[] {
  const seen = new Set<string>();
  const merged: ShapeNote[] = [];
  for (const note of [...a, ...b]) {
    const key = `${note.string}:${note.fret}:${note.degree}:${note.pc}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(note);
  }
  merged.sort((x, y) => x.string - y.string || x.fret - y.fret);
  return merged;
}

export function collectNotesNearShape(
  anchorShape: readonly ShapeNote[],
  notes: readonly ShapeNote[],
  radii: { fretRadius?: number; stringRadius?: number },
): ShapeNote[] {
  const fretRadius = radii.fretRadius ?? 0;
  const stringRadius = radii.stringRadius ?? 0;
  const nearby = notes.filter((note) =>
    anchorShape.some(
      (anchor) =>
        Math.abs(anchor.fret - note.fret) <= fretRadius &&
        Math.abs(anchor.string - note.string) <= stringRadius,
    ),
  );
  return mergeShapeNotes(anchorShape, nearby);
}

export function shapeMatchesNotesPerString(
  shape: readonly ShapeNote[],
  constraint: NotesPerStringConstraint,
  options: { stringCount?: number } = {},
): boolean {
  const counts = getNotesPerString(shape);
  const includeEmpty = constraint.includeEmptyStrings === true;

  let values: number[];
  if (includeEmpty && typeof options.stringCount === "number") {
    values = Array.from(
      { length: options.stringCount },
      (_, string) => counts.get(string) ?? 0,
    );
  } else {
    values = [...counts.values()];
  }

  if (values.length === 0) return false;

  if (constraint.kind === "exact") {
    return values.every((value) => value === constraint.value);
  }

  return values.every((value) => {
    if (constraint.min != null && value < constraint.min) return false;
    if (constraint.max != null && value > constraint.max) return false;
    return true;
  });
}

function shapeMeetsDegreeCoverage(
  shape: readonly ShapeNote[],
  targetPcs: Iterable<number>,
  constraint: DegreeCoverageConstraint,
): boolean {
  const coverage = shapeDegreeCoverage(shape, targetPcs);
  if (constraint.kind === "all-degrees") {
    return coverage.covered === coverage.total;
  }
  return coverage.covered >= constraint.count;
}

function withinMax(value: number, max: number | undefined): boolean {
  return max == null || value <= max;
}

function shapeWithinSpanLimits(
  shape: readonly ShapeNote[],
  maxFretSpan: number | undefined,
  maxStringSpan: number | undefined,
): boolean {
  return (
    withinMax(shapeFretSpan(shape), maxFretSpan) &&
    withinMax(shapeStringSpan(shape), maxStringSpan)
  );
}

function shapeWithinSizeAndSpanLimits(
  shape: readonly ShapeNote[],
  spec: ShapeSystemSpec,
): boolean {
  if (spec.minNotes != null && shape.length < spec.minNotes) return false;
  if (!withinMax(shape.length, spec.maxNotes)) return false;
  return shapeWithinSpanLimits(shape, spec.maxFretSpan, spec.maxStringSpan);
}

function shapeSatisfiesSystemSpec(
  shape: readonly ShapeNote[],
  spec: ShapeSystemSpec,
  degreePcs: Iterable<number>,
): boolean {
  if (shape.length === 0) return false;
  if (!shapeWithinSizeAndSpanLimits(shape, spec)) return false;
  if (spec.requireRoot && !shapeHasRoot(shape)) return false;
  if (spec.contiguousStringsOnly && !shapeHasContiguousStrings(shape))
    return false;
  if (
    spec.degreeCoverage &&
    !shapeMeetsDegreeCoverage(shape, degreePcs, spec.degreeCoverage)
  ) {
    return false;
  }
  return true;
}

function groupOccurrencesByTemplate(
  occurrences: readonly ShapeOccurrence[],
): Record<string, ShapeOccurrence[]> {
  const templateToOccurrences: Record<string, ShapeOccurrence[]> = {};
  for (const occurrence of occurrences) {
    (templateToOccurrences[occurrence.templateId] ??= []).push(occurrence);
  }
  return templateToOccurrences;
}

function windowStartFrets(
  width: number,
  search: { fretMin: number; fretMax: number },
): number[] {
  const starts: number[] = [];
  for (
    let startFret = search.fretMin;
    startFret + width - 1 <= search.fretMax;
    startFret += 1
  ) {
    starts.push(startFret);
  }
  return starts;
}

function generateCandidates(
  noteMap: readonly ShapeNote[],
  strategy: ExtractionStrategy,
  search: { fretMin: number; fretMax: number },
): ShapeNote[][] {
  if (strategy.kind === "window") {
    return windowStartFrets(strategy.width, search).map((startFret) =>
      extractWindowShape(noteMap, { startFret, width: strategy.width }),
    );
  }

  if (strategy.kind === "connected") {
    const options: ConnectedComponentOptions = {
      maxStringStep: strategy.maxStringStep,
      maxFretStep: strategy.maxFretStep,
      fretMin: search.fretMin,
      fretMax: search.fretMax,
    };
    return extractConnectedComponentShapes(noteMap, options);
  }

  return windowStartFrets(strategy.width, search).flatMap((startFret) => {
    const window = extractWindowShape(noteMap, {
      startFret,
      width: strategy.width,
    });
    return extractConnectedComponentShapes(window, {
      maxStringStep: strategy.maxStringStep,
      maxFretStep: strategy.maxFretStep,
      fretMin: startFret,
      fretMax: startFret + strategy.width - 1,
    });
  });
}

function groupedNotesByString(
  shape: readonly ShapeNote[],
): Map<number, ShapeNote[]> {
  const grouped = new Map<number, ShapeNote[]>();
  for (const note of shape) {
    const bucket = grouped.get(note.string) ?? [];
    bucket.push(note);
    grouped.set(note.string, bucket);
  }
  for (const [, bucket] of grouped) {
    bucket.sort((a, b) => a.fret - b.fret || a.degree - b.degree);
  }
  return grouped;
}

function makeStringWindowsForExact(
  shape: readonly ShapeNote[],
  exact: number,
  options: {
    requireContiguousStrings?: boolean;
    maxCombinations?: number;
  } = {},
): ShapeNote[][] {
  // Generates Cartesian products of per-string local slices:
  // each participating string contributes every consecutive window of `exact` notes.
  if (exact <= 0) return [];
  const grouped = groupedNotesByString(shape);
  if (grouped.size === 0) return [];

  const strings = [...grouped.keys()].sort((a, b) => a - b);
  if (options.requireContiguousStrings) {
    for (let i = 1; i < strings.length; i += 1) {
      if (strings[i] - strings[i - 1] !== 1) return [];
    }
  }

  const stringBuckets = strings
    .map((string) => grouped.get(string) ?? [])
    .map((notes) => {
      if (notes.length < exact) return [] as ShapeNote[][];
      const slices: ShapeNote[][] = [];
      for (let index = 0; index + exact <= notes.length; index += 1) {
        slices.push(notes.slice(index, index + exact));
      }
      return slices;
    });

  if (stringBuckets.some((bucket) => bucket.length === 0)) return [];

  const combinations: ShapeNote[][] = [];
  const maxCombinations = options.maxCombinations ?? 2048;
  const walk = (stringIndex: number, acc: ShapeNote[]) => {
    if (combinations.length >= maxCombinations) return;
    if (stringIndex >= stringBuckets.length) {
      combinations.push(acc);
      return;
    }
    for (const slice of stringBuckets[stringIndex]) {
      walk(stringIndex + 1, [...acc, ...slice]);
    }
  };
  walk(0, []);
  return combinations;
}

function resolveSearchRange(
  fretboardInput: GenerateShapeFamilyInput["fretboardInput"],
  search: GenerateShapeFamilyInput["search"],
): { fretMin: number; fretMax: number } {
  return {
    fretMin: search?.fretMin ?? fretboardInput.fretMin,
    fretMax: search?.fretMax ?? fretboardInput.fretMax,
  };
}

function resolveFretboardPcs(
  fretboardInput: GenerateShapeFamilyInput["fretboardInput"],
  pcs: number[] | Set<number>,
  pcsMode: PitchClassMode | undefined,
): number[] {
  return resolveRelativePitchClassSet({
    n: fretboardInput.n,
    pcs,
    pcsMode,
    rootPc: fretboardInput.rootPc,
    rootLocation: fretboardInput.rootLocation,
    tuning: fretboardInput.tuning,
  });
}

function buildFamilyResult(
  systemId: string,
  templates: Shape[],
  shapes: readonly ShapeNote[][],
  keepTemplateId: (templateId: string) => boolean = () => true,
): ShapeFamilyResult {
  const occurrences = shapes
    .map((notes, index) => {
      const shape = buildShape(notes);
      return makeOccurrence(shape.notes, shape.templateId, index);
    })
    .filter((occ) => keepTemplateId(occ.templateId));
  return {
    systemId,
    templates,
    occurrences,
    templateToOccurrences: groupOccurrencesByTemplate(occurrences),
  };
}

function defaultStrategy(spec: ShapeSystemSpec): ExtractionStrategy {
  if (spec.extractionStrategy) return spec.extractionStrategy;
  return { kind: "connected", maxStringStep: 1, maxFretStep: 2 };
}

export function generateChordCandidates(params: {
  chordNotes: readonly ShapeNote[];
  chordAnchor: ChordAnchorSpec;
  search: { fretMin: number; fretMax: number };
  contiguousStringsOnly?: boolean;
}): ShapeNote[][] {
  const { chordNotes, chordAnchor, search, contiguousStringsOnly } = params;
  const strategy =
    chordAnchor.chordExtractionStrategy ??
    ({ kind: "connected" } satisfies ExtractionStrategy);
  const candidates = generateCandidates(chordNotes, strategy, search);
  return candidates.filter((candidate) => {
    if (candidate.length === 0) return false;
    if (
      chordAnchor.minChordToneCount != null &&
      !shapeContainsMinChordTones(candidate, chordAnchor.minChordToneCount)
    ) {
      return false;
    }
    if (chordAnchor.requireChordRoot && !shapeContainsChordRoot(candidate))
      return false;
    if (
      !shapeWithinSpanLimits(
        candidate,
        chordAnchor.maxChordFretSpan,
        chordAnchor.maxChordStringSpan,
      )
    ) {
      return false;
    }
    if (contiguousStringsOnly && !shapeHasContiguousStrings(candidate))
      return false;
    return true;
  });
}

export function generateChordAnchoredShapeFamily({
  fretboardInput,
  systemSpec,
  search,
}: GenerateShapeFamilyInput): ShapeFamilyResult {
  if (!systemSpec.chordAnchor) {
    throw new Error(
      "systemSpec.chordAnchor is required for chord-anchored generation",
    );
  }
  const chordAnchor = systemSpec.chordAnchor;
  const searchRange = resolveSearchRange(fretboardInput, search);
  const resolvedScalePcs = resolveFretboardPcs(
    fretboardInput,
    systemSpec.pitchClassSet,
    systemSpec.pcsMode,
  );
  const resolvedChordPcs = resolveFretboardPcs(
    fretboardInput,
    chordAnchor.chordPitchClassSet,
    chordAnchor.chordPcsMode ?? systemSpec.pcsMode,
  );

  const scaleNotes = buildFretboardMap({
    ...fretboardInput,
    pcs: systemSpec.pitchClassSet,
    pcsMode: systemSpec.pcsMode,
  });
  const chordNotes = buildFretboardMap({
    ...fretboardInput,
    pcs: resolvedChordPcs,
    pcsMode: "relative",
  });

  const chordCandidates = generateChordCandidates({
    chordNotes,
    chordAnchor,
    search: searchRange,
    contiguousStringsOnly: systemSpec.contiguousStringsOnly,
  });

  const neighborhoodCandidates = chordCandidates.map((chordShape) =>
    collectNotesNearShape(chordShape, scaleNotes, {
      fretRadius: chordAnchor.neighborhoodFretRadius ?? 2,
      stringRadius: chordAnchor.neighborhoodStringRadius ?? 1,
    }),
  );

  const filtered = neighborhoodCandidates.filter((shape) => {
    if (!shapeSatisfiesSystemSpec(shape, systemSpec, resolvedScalePcs))
      return false;
    return (
      chordAnchor.minChordToneCount == null ||
      shapeDegreeCoverage(shape, resolvedChordPcs).covered >=
        chordAnchor.minChordToneCount
    );
  });

  return buildFamilyResult(
    systemSpec.systemId,
    dedupeShapesByTemplate(filtered),
    filtered,
  );
}

function makeOccurrence(
  notes: ShapeNote[],
  templateId: string,
  index: number,
): ShapeOccurrence {
  const summary = summarizeShape(notes);
  return {
    occurrenceId: `${index}:${templateId}`,
    startFret: summary.fretSpan[0],
    endFret: summary.fretSpan[1],
    templateId,
    notes,
  };
}

export function generateShapeFamily({
  fretboardInput,
  systemSpec,
  search,
}: GenerateShapeFamilyInput): ShapeFamilyResult {
  if (systemSpec.chordAnchor) {
    return generateChordAnchoredShapeFamily({
      fretboardInput,
      systemSpec,
      search,
    });
  }

  const noteMap = buildFretboardMap({
    ...fretboardInput,
    pcs: systemSpec.pitchClassSet,
    pcsMode: systemSpec.pcsMode,
  });
  const resolvedSystemPcs = resolveFretboardPcs(
    fretboardInput,
    systemSpec.pitchClassSet,
    systemSpec.pcsMode,
  );

  const strategy = defaultStrategy(systemSpec);
  const searchRange = resolveSearchRange(fretboardInput, search);
  const candidates = generateCandidates(noteMap, strategy, searchRange);
  const exactNotesPerStringValue =
    systemSpec.notesPerString?.kind === "exact"
      ? systemSpec.notesPerString.value
      : undefined;
  const normalizedCandidates =
    exactNotesPerStringValue == null
      ? candidates
      : candidates.flatMap((candidate) =>
          makeStringWindowsForExact(candidate, exactNotesPerStringValue, {
            requireContiguousStrings: systemSpec.contiguousStringsOnly,
          }).filter((shape) => shapeWithinSizeAndSpanLimits(shape, systemSpec)),
        );
  const notesPerString = systemSpec.notesPerString;
  const filtered = normalizedCandidates.filter(
    (shape) =>
      shapeSatisfiesSystemSpec(shape, systemSpec, resolvedSystemPcs) &&
      (!notesPerString ||
        shapeMatchesNotesPerString(shape, notesPerString, {
          stringCount: fretboardInput.tuning.length,
        })),
  );

  const dedupedTemplates = dedupeShapesByTemplate(filtered);
  const templateIds = new Set(
    dedupedTemplates.map((shape) => shape.templateId),
  );
  return buildFamilyResult(
    systemSpec.systemId,
    dedupedTemplates,
    filtered,
    (templateId) => templateIds.has(templateId),
  );
}

type ShapeSystemSpecParams = Partial<ShapeSystemSpec> & {
  pitchClassSet?: number[] | Set<number>;
};

// Each field of `defaults` is taken from `params` unless that value is
// null/undefined. Only keys present in `defaults` are emitted, and systemId is
// never overridable.
function withSpecDefaults(
  defaults: ShapeSystemSpec,
  params: ShapeSystemSpecParams,
): ShapeSystemSpec {
  const spec: Record<string, unknown> = { systemId: defaults.systemId };
  for (const [key, value] of Object.entries(defaults)) {
    if (key === "systemId") continue;
    spec[key] = params[key as keyof ShapeSystemSpec] ?? value;
  }
  return spec as ShapeSystemSpec;
}

export function createPentatonicBoxSpec(
  params: ShapeSystemSpecParams = {},
): ShapeSystemSpec {
  return withSpecDefaults(
    {
      systemId: "pentatonic-box",
      pitchClassSet: [0, 3, 5, 7, 10],
      pcsMode: "relative",
      requireRoot: true,
      maxFretSpan: 4,
      maxStringSpan: 5,
      notesPerString: { kind: "min-max", min: 1, max: 3 },
      degreeCoverage: { kind: "all-degrees" },
      contiguousStringsOnly: true,
      minNotes: 5,
      maxNotes: undefined,
      extractionStrategy: {
        kind: "hybrid",
        width: 5,
        maxStringStep: 1,
        maxFretStep: 2,
      },
    },
    params,
  );
}

export function createThreeNpsSpec(
  params: ShapeSystemSpecParams = {},
): ShapeSystemSpec {
  return withSpecDefaults(
    {
      systemId: "three-nps",
      pitchClassSet: [0, 2, 4, 5, 7, 9, 11],
      pcsMode: "relative",
      requireRoot: true,
      maxFretSpan: 6,
      maxStringSpan: undefined,
      notesPerString: { kind: "exact", value: 3 },
      degreeCoverage: { kind: "at-least", count: 5 },
      contiguousStringsOnly: true,
      minNotes: 6,
      maxNotes: undefined,
      extractionStrategy: {
        kind: "hybrid",
        width: 7,
        maxStringStep: 1,
        maxFretStep: 3,
      },
    },
    params,
  );
}

export function createCagedMajorSpec(
  params: ShapeSystemSpecParams = {},
): ShapeSystemSpec {
  return withSpecDefaults(
    {
      systemId: "caged-major",
      pitchClassSet: [0, 2, 4, 5, 7, 9, 11],
      pcsMode: "relative",
      requireRoot: true,
      maxFretSpan: 5,
      maxStringSpan: 5,
      notesPerString: { kind: "min-max", min: 1, max: 3 },
      degreeCoverage: { kind: "at-least", count: 6 },
      contiguousStringsOnly: true,
      minNotes: 7,
      maxNotes: undefined,
      extractionStrategy: {
        kind: "hybrid",
        width: 6,
        maxStringStep: 1,
        maxFretStep: 2,
      },
      chordAnchor: {
        chordPitchClassSet: [...CHORD_PRESETS.majorTriad],
        chordPcsMode: "relative",
        minChordToneCount: 3,
        requireChordRoot: true,
        maxChordFretSpan: 4,
        maxChordStringSpan: 4,
        chordExtractionStrategy: {
          kind: "hybrid",
          width: 5,
          maxStringStep: 1,
          maxFretStep: 2,
        },
        neighborhoodFretRadius: 2,
        neighborhoodStringRadius: 1,
      },
    },
    params,
  );
}

function looksLikeStandardGuitar(tuning: readonly number[]): boolean {
  const standard = [4, 9, 2, 7, 11, 4];
  return (
    tuning.length === standard.length &&
    tuning.every((v, i) => v === standard[i])
  );
}

export function labelStandardGuitarCagedTemplatesHeuristically(params: {
  n: number;
  tuning: readonly number[];
  systemSpec: ShapeSystemSpec;
  templates: readonly Shape[];
}): Record<string, "C" | "A" | "G" | "E" | "D"> {
  const { n, tuning, systemSpec, templates } = params;
  if (
    n !== 12 ||
    systemSpec.systemId !== "caged-major" ||
    !looksLikeStandardGuitar(tuning)
  ) {
    return {};
  }

  const labels: Array<"C" | "A" | "G" | "E" | "D"> = ["C", "A", "G", "E", "D"];
  const sortedByRoot = [...templates].sort((a, b) => {
    const aRoot = a.summary.rootLocations[0];
    const bRoot = b.summary.rootLocations[0];
    return (
      (aRoot?.fret ?? 0) - (bRoot?.fret ?? 0) ||
      (aRoot?.string ?? 0) - (bRoot?.string ?? 0)
    );
  });

  const out: Record<string, "C" | "A" | "G" | "E" | "D"> = {};
  sortedByRoot.forEach((template, index) => {
    out[template.templateId] = labels[index % labels.length];
  });
  return out;
}
