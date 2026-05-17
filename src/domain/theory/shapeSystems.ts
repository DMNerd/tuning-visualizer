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
  | { kind: "all-degrees" }
  | { kind: "at-least"; count: number };

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

function generateCandidates(
  noteMap: readonly ShapeNote[],
  strategy: ExtractionStrategy,
  search: { fretMin: number; fretMax: number },
): ShapeNote[][] {
  if (strategy.kind === "window") {
    const out: ShapeNote[][] = [];
    for (
      let startFret = search.fretMin;
      startFret + strategy.width - 1 <= search.fretMax;
      startFret += 1
    ) {
      out.push(
        extractWindowShape(noteMap, { startFret, width: strategy.width }),
      );
    }
    return out;
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

  const out: ShapeNote[][] = [];
  for (
    let startFret = search.fretMin;
    startFret + strategy.width - 1 <= search.fretMax;
    startFret += 1
  ) {
    const window = extractWindowShape(noteMap, {
      startFret,
      width: strategy.width,
    });
    const components = extractConnectedComponentShapes(window, {
      maxStringStep: strategy.maxStringStep,
      maxFretStep: strategy.maxFretStep,
      fretMin: startFret,
      fretMax: startFret + strategy.width - 1,
    });
    out.push(...components);
  }

  return out;
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
      chordAnchor.maxChordFretSpan != null &&
      shapeFretSpan(candidate) > chordAnchor.maxChordFretSpan
    ) {
      return false;
    }
    if (
      chordAnchor.maxChordStringSpan != null &&
      shapeStringSpan(candidate) > chordAnchor.maxChordStringSpan
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
  const searchRange = {
    fretMin: search?.fretMin ?? fretboardInput.fretMin,
    fretMax: search?.fretMax ?? fretboardInput.fretMax,
  };
  const resolvedScalePcs = resolveRelativePitchClassSet({
    n: fretboardInput.n,
    pcs: systemSpec.pitchClassSet,
    pcsMode: systemSpec.pcsMode,
    rootPc: fretboardInput.rootPc,
    rootLocation: fretboardInput.rootLocation,
    tuning: fretboardInput.tuning,
  });
  const resolvedChordPcs = resolveRelativePitchClassSet({
    n: fretboardInput.n,
    pcs: systemSpec.chordAnchor.chordPitchClassSet,
    pcsMode: systemSpec.chordAnchor.chordPcsMode ?? systemSpec.pcsMode,
    rootPc: fretboardInput.rootPc,
    rootLocation: fretboardInput.rootLocation,
    tuning: fretboardInput.tuning,
  });

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
    chordAnchor: systemSpec.chordAnchor,
    search: searchRange,
    contiguousStringsOnly: systemSpec.contiguousStringsOnly,
  });

  const neighborhoodCandidates = chordCandidates.map((chordShape) =>
    collectNotesNearShape(chordShape, scaleNotes, {
      fretRadius: systemSpec.chordAnchor?.neighborhoodFretRadius ?? 2,
      stringRadius: systemSpec.chordAnchor?.neighborhoodStringRadius ?? 1,
    }),
  );

  const filtered = neighborhoodCandidates.filter((shape) => {
    if (shape.length === 0) return false;
    if (systemSpec.minNotes != null && shape.length < systemSpec.minNotes)
      return false;
    if (systemSpec.maxNotes != null && shape.length > systemSpec.maxNotes)
      return false;
    if (systemSpec.requireRoot && !shapeHasRoot(shape)) return false;
    if (
      systemSpec.maxFretSpan != null &&
      shapeFretSpan(shape) > systemSpec.maxFretSpan
    )
      return false;
    if (
      systemSpec.maxStringSpan != null &&
      shapeStringSpan(shape) > systemSpec.maxStringSpan
    )
      return false;
    if (systemSpec.contiguousStringsOnly && !shapeHasContiguousStrings(shape))
      return false;
    if (
      systemSpec.degreeCoverage &&
      !shapeMeetsDegreeCoverage(
        shape,
        resolvedScalePcs,
        systemSpec.degreeCoverage,
      )
    ) {
      return false;
    }
    const chordToneCoverage = shapeDegreeCoverage(shape, resolvedChordPcs);
    if (
      systemSpec.chordAnchor?.minChordToneCount != null &&
      chordToneCoverage.covered < systemSpec.chordAnchor.minChordToneCount
    ) {
      return false;
    }
    return true;
  });

  const templates = dedupeShapesByTemplate(filtered);
  const occurrences = filtered.map((notes, index) => {
    const shape = buildShape(notes);
    return makeOccurrence(shape.notes, shape.templateId, index);
  });
  const templateToOccurrences: Record<string, ShapeOccurrence[]> = {};
  for (const occurrence of occurrences) {
    if (!templateToOccurrences[occurrence.templateId]) {
      templateToOccurrences[occurrence.templateId] = [];
    }
    templateToOccurrences[occurrence.templateId].push(occurrence);
  }
  return {
    systemId: systemSpec.systemId,
    templates,
    occurrences,
    templateToOccurrences,
  };
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
  const resolvedSystemPcs = resolveRelativePitchClassSet({
    n: fretboardInput.n,
    pcs: systemSpec.pitchClassSet,
    pcsMode: systemSpec.pcsMode,
    rootPc: fretboardInput.rootPc,
    rootLocation: fretboardInput.rootLocation,
    tuning: fretboardInput.tuning,
  });

  const strategy = defaultStrategy(systemSpec);
  const searchRange = {
    fretMin: search?.fretMin ?? fretboardInput.fretMin,
    fretMax: search?.fretMax ?? fretboardInput.fretMax,
  };
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
          }).filter((shape) => {
            if (
              systemSpec.maxFretSpan != null &&
              shapeFretSpan(shape) > systemSpec.maxFretSpan
            )
              return false;
            if (
              systemSpec.maxStringSpan != null &&
              shapeStringSpan(shape) > systemSpec.maxStringSpan
            )
              return false;
            if (
              systemSpec.minNotes != null &&
              shape.length < systemSpec.minNotes
            )
              return false;
            if (
              systemSpec.maxNotes != null &&
              shape.length > systemSpec.maxNotes
            )
              return false;
            return true;
          }),
        );
  const filtered = normalizedCandidates.filter((shape) => {
    if (shape.length === 0) return false;
    if (systemSpec.minNotes != null && shape.length < systemSpec.minNotes)
      return false;
    if (systemSpec.maxNotes != null && shape.length > systemSpec.maxNotes)
      return false;
    if (systemSpec.requireRoot && !shapeHasRoot(shape)) return false;
    if (
      systemSpec.maxFretSpan != null &&
      shapeFretSpan(shape) > systemSpec.maxFretSpan
    )
      return false;
    if (
      systemSpec.maxStringSpan != null &&
      shapeStringSpan(shape) > systemSpec.maxStringSpan
    )
      return false;
    if (systemSpec.contiguousStringsOnly && !shapeHasContiguousStrings(shape))
      return false;
    if (
      systemSpec.notesPerString &&
      !shapeMatchesNotesPerString(shape, systemSpec.notesPerString, {
        stringCount: fretboardInput.tuning.length,
      })
    ) {
      return false;
    }
    if (
      systemSpec.degreeCoverage &&
      !shapeMeetsDegreeCoverage(
        shape,
        resolvedSystemPcs,
        systemSpec.degreeCoverage,
      )
    ) {
      return false;
    }
    return true;
  });

  const dedupedTemplates = dedupeShapesByTemplate(filtered);
  const templateIds = new Set(
    dedupedTemplates.map((shape) => shape.templateId),
  );

  const occurrences = filtered
    .map((notes, index) => {
      const shape = buildShape(notes);
      return makeOccurrence(shape.notes, shape.templateId, index);
    })
    .filter((occ) => templateIds.has(occ.templateId));

  const templateToOccurrences: Record<string, ShapeOccurrence[]> = {};
  for (const occurrence of occurrences) {
    if (!templateToOccurrences[occurrence.templateId]) {
      templateToOccurrences[occurrence.templateId] = [];
    }
    templateToOccurrences[occurrence.templateId].push(occurrence);
  }

  return {
    systemId: systemSpec.systemId,
    templates: dedupedTemplates,
    occurrences,
    templateToOccurrences,
  };
}

export function createPentatonicBoxSpec(
  params: Partial<ShapeSystemSpec> & {
    pitchClassSet?: number[] | Set<number>;
  } = {},
): ShapeSystemSpec {
  return {
    systemId: "pentatonic-box",
    pitchClassSet: params.pitchClassSet ?? [0, 3, 5, 7, 10],
    pcsMode: params.pcsMode ?? "relative",
    requireRoot: params.requireRoot ?? true,
    maxFretSpan: params.maxFretSpan ?? 4,
    maxStringSpan: params.maxStringSpan ?? 5,
    notesPerString:
      params.notesPerString ??
      ({ kind: "min-max", min: 1, max: 3 } satisfies NotesPerStringConstraint),
    degreeCoverage:
      params.degreeCoverage ??
      ({ kind: "all-degrees" } satisfies DegreeCoverageConstraint),
    contiguousStringsOnly: params.contiguousStringsOnly ?? true,
    minNotes: params.minNotes ?? 5,
    maxNotes: params.maxNotes,
    extractionStrategy:
      params.extractionStrategy ??
      ({
        kind: "hybrid",
        width: 5,
        maxStringStep: 1,
        maxFretStep: 2,
      } satisfies ExtractionStrategy),
  };
}

export function createThreeNpsSpec(
  params: Partial<ShapeSystemSpec> & {
    pitchClassSet?: number[] | Set<number>;
  } = {},
): ShapeSystemSpec {
  return {
    systemId: "three-nps",
    pitchClassSet: params.pitchClassSet ?? [0, 2, 4, 5, 7, 9, 11],
    pcsMode: params.pcsMode ?? "relative",
    requireRoot: params.requireRoot ?? true,
    maxFretSpan: params.maxFretSpan ?? 6,
    maxStringSpan: params.maxStringSpan,
    notesPerString:
      params.notesPerString ??
      ({ kind: "exact", value: 3 } satisfies NotesPerStringConstraint),
    degreeCoverage:
      params.degreeCoverage ??
      ({ kind: "at-least", count: 5 } satisfies DegreeCoverageConstraint),
    contiguousStringsOnly: params.contiguousStringsOnly ?? true,
    minNotes: params.minNotes ?? 6,
    maxNotes: params.maxNotes,
    extractionStrategy:
      params.extractionStrategy ??
      ({
        kind: "hybrid",
        width: 7,
        maxStringStep: 1,
        maxFretStep: 3,
      } satisfies ExtractionStrategy),
  };
}

export function createCagedMajorSpec(
  params: Partial<ShapeSystemSpec> & {
    pitchClassSet?: number[] | Set<number>;
  } = {},
): ShapeSystemSpec {
  return {
    systemId: "caged-major",
    pitchClassSet: params.pitchClassSet ?? [0, 2, 4, 5, 7, 9, 11],
    pcsMode: params.pcsMode ?? "relative",
    requireRoot: params.requireRoot ?? true,
    maxFretSpan: params.maxFretSpan ?? 5,
    maxStringSpan: params.maxStringSpan ?? 5,
    notesPerString:
      params.notesPerString ??
      ({ kind: "min-max", min: 1, max: 3 } satisfies NotesPerStringConstraint),
    degreeCoverage:
      params.degreeCoverage ??
      ({ kind: "at-least", count: 6 } satisfies DegreeCoverageConstraint),
    contiguousStringsOnly: params.contiguousStringsOnly ?? true,
    minNotes: params.minNotes ?? 7,
    maxNotes: params.maxNotes,
    extractionStrategy:
      params.extractionStrategy ??
      ({
        kind: "hybrid",
        width: 6,
        maxStringStep: 1,
        maxFretStep: 2,
      } satisfies ExtractionStrategy),
    chordAnchor: params.chordAnchor ?? {
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
  };
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

export function labelStandardGuitarCagedTemplates(params: {
  n: number;
  tuning: readonly number[];
  systemSpec: ShapeSystemSpec;
  templates: readonly Shape[];
}): Record<string, "C" | "A" | "G" | "E" | "D"> {
  return labelStandardGuitarCagedTemplatesHeuristically(params);
}
