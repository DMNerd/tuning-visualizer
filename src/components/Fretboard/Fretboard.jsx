import {
  memo,
  forwardRef,
  useLayoutEffect,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import clsx from "clsx";
import { useFretboardLayout } from "@/hooks/useFretboardLayout";
import { useSystemNoteNames } from "@/hooks/useSystemNoteNames";
import { useScaleAndChord } from "@/hooks/useScaleAndChord";
import { useInlays } from "@/hooks/useInlays";
import { useLabels } from "@/hooks/useLabels";
import { getDegreeColor } from "@/utils/degreeColors";
import { buildFretLabel, MICRO_LABEL_STYLES } from "@/utils/fretLabels";
import {
  arrayRefAndLengthEqual,
  objectRefAndKeyEqual,
  setRefAndSizeEqual,
} from "@/utils/memo";
import { createTextFit } from "@/utils/textFit";
import {
  maybePreventContextMenu,
  parseDatasetNumber,
  resolveClosestDatasetElement,
} from "@/utils/svgDelegation";
import { toStringMetaMap } from "@/lib/meta/meta";
import {
  normalizeHiddenFrets,
  isHiddenFret,
  buildRenderedFretIndices,
  resolveVisibleCapoFret,
  reconcileCapoState,
} from "@/components/Fretboard/renderFilters";

const ROOT_NOTE_RADIUS_MULTIPLIER = 1.1;
const CHORD_NOTE_RADIUS_MULTIPLIER = 1.05;
const CHORD_ROOT_STROKE_WIDTH = 2.4;
const CHORD_NOTE_STROKE_WIDTH = 1.8;
const PANEL_CORNER_RADIUS = 14;
const INLAY_RADIUS = 6.5;
const DOUBLE_INLAY_VERTICAL_OFFSET = 14;
const NUT_VERTICAL_PADDING = 8;
const NOTE_FONT_MIN = 6;
const NOTE_FONT_MAX = 11.5;
const MARKER_FONT_MIN = 6;
const MARKER_FONT_MAX = 11.5;
const APP_FONT_STACK =
  'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const SPATIAL_BUCKET_SIZE = 36;

function forEachBucketKey2D(bounds, bucketSize, visit) {
  const startX = Math.floor(bounds.left / bucketSize);
  const endX = Math.floor(bounds.right / bucketSize);
  const startY = Math.floor(bounds.top / bucketSize);
  const endY = Math.floor(bounds.bottom / bucketSize);
  for (let bx = startX; bx <= endX; bx += 1) {
    for (let by = startY; by <= endY; by += 1) {
      visit(`${bx}:${by}`);
    }
  }
}

function collides2D(bounds, bucketStore, bucketSize) {
  let collided = false;
  forEachBucketKey2D(bounds, bucketSize, (key) => {
    if (collided) return;
    const bucket = bucketStore.get(key);
    if (!bucket) return;
    for (let i = 0; i < bucket.length; i += 1) {
      const b = bucket[i];
      if (
        bounds.left < b.right &&
        bounds.right > b.left &&
        bounds.top < b.bottom &&
        bounds.bottom > b.top
      ) {
        collided = true;
        return;
      }
    }
  });
  return collided;
}

function addBounds2D(bounds, bucketStore, bucketSize) {
  forEachBucketKey2D(bounds, bucketSize, (key) => {
    const bucket = bucketStore.get(key);
    if (bucket) bucket.push(bounds);
    else bucketStore.set(key, [bounds]);
  });
}

function forEachBucketKey1D(bounds, bucketSize, visit) {
  const startX = Math.floor(bounds.left / bucketSize);
  const endX = Math.floor(bounds.right / bucketSize);
  for (let bx = startX; bx <= endX; bx += 1) {
    visit(String(bx));
  }
}

function collides1D(bounds, bucketStore, bucketSize) {
  let collided = false;
  forEachBucketKey1D(bounds, bucketSize, (key) => {
    if (collided) return;
    const bucket = bucketStore.get(key);
    if (!bucket) return;
    for (let i = 0; i < bucket.length; i += 1) {
      const b = bucket[i];
      if (bounds.left < b.right && bounds.right > b.left) {
        collided = true;
        return;
      }
    }
  });
  return collided;
}

function addBounds1D(bounds, bucketStore, bucketSize) {
  forEachBucketKey1D(bounds, bucketSize, (key) => {
    const bucket = bucketStore.get(key);
    if (bucket) bucket.push(bounds);
    else bucketStore.set(key, [bounds]);
  });
}

function buildLabelVariants(label, { kind, allowSingleCharFallback = true }) {
  const compact = label.replace(/\s+/g, "");
  const variants = [compact];

  if (kind === "note") {
    if (compact.includes("/")) {
      variants.push(compact.split("/")[0]);
    }
    variants.push(compact.slice(0, 2));
    if (allowSingleCharFallback) variants.push(compact.slice(0, 1));
    return Array.from(new Set(variants.filter(Boolean)));
  }

  if (compact.includes("+")) {
    const [base, fracRaw] = compact.split("+");
    const frac = fracRaw ?? "";
    const slashChar = frac.includes("⁄") ? "⁄" : frac.includes("/") ? "/" : "";
    if (slashChar) {
      const [num = "", den = ""] = frac.split(slashChar);
      variants.push(`${base}+${num}${slashChar}${den}`);
      variants.push(`${base}+${num}${slashChar}…`);
      variants.push(`${base}+…${slashChar}${den}`);
      variants.push(`${base}+${num}`);
    }
  } else if (compact.includes("/") || compact.includes("⁄")) {
    const slashChar = compact.includes("⁄") ? "⁄" : "/";
    const [left = "", right = ""] = compact.split(slashChar);
    variants.push(`${left}${slashChar}…`);
    variants.push(`…${slashChar}${right}`);
  }

  variants.push(compact.slice(0, 2));
  if (allowSingleCharFallback) variants.push(compact.slice(0, 1));
  return Array.from(new Set(variants.filter(Boolean)));
}

function buildFitCacheKey({
  variants,
  maxWidth,
  minFontSize,
  maxFontSize,
  step,
  fontWeight,
  allowSingleCharFallback,
}) {
  return [
    variants.join("\u241F"),
    Number(maxWidth).toFixed(3),
    Number(minFontSize).toFixed(3),
    Number(maxFontSize).toFixed(3),
    Number(step).toFixed(3),
    fontWeight,
    allowSingleCharFallback ? "1" : "0",
  ].join("|");
}

function buildWidthCacheKey({ label, fontSize, fontWeight }) {
  return [
    label,
    Number(fontSize).toFixed(3),
    Number(fontWeight).toFixed(3),
  ].join("|");
}

const Fretboard = forwardRef(function Fretboard(
  {
    strings,
    frets,
    tuning,
    rootIx,
    intervals,
    accidental,
    noteNaming,
    microLabelStyle,
    show,
    showOpen,
    showFretNums,
    dotSize,
    lefty,
    system,
    chordPCs,
    chordRootPc,
    openOnlyInScale,
    colorByDegree,
    hideNonChord,
    stringMeta,
    boardMeta,

    onSelectNote,
    capoFret,
    onSetCapo = () => {},
  },
  ref,
) {
  const svgRef = useRef(null);

  const {
    width,
    height,
    nutW,
    padTop,
    padBottom,
    padLeft,
    boardEndX,
    fretXs,
    FRETNUM_TOP_GAP,
    FRETNUM_BOTTOM_GAP,
    wireX,
    betweenFretsX,
    yForString,
    startFretFor,
    stringStartX,
    openXForString,
  } = useFretboardLayout({ frets, strings, dotSize, stringMeta });

  useLayoutEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.setAttribute("viewBox", `0 0 ${width} ${height}`);
    if (typeof ref === "function") ref(svgRef.current);
    else if (ref) ref.current = svgRef.current;
  }, [ref, width, height]);

  const displayX = (x) => (lefty ? width - x : x);

  const { pcFromName, nameForPc } = useSystemNoteNames(
    system,
    accidental,
    noteNaming,
  );
  const pcForName = pcFromName;
  const notePlacementMode =
    boardMeta?.notePlacement === "onFret" ? "onFret" : "between";
  const fretStyle = boardMeta?.fretStyle ?? "solid";
  const hiddenFrets = useMemo(
    () => normalizeHiddenFrets(boardMeta?.hiddenFrets),
    [boardMeta?.hiddenFrets],
  );

  const isFretHidden = useCallback(
    (fretIndex) => isHiddenFret(hiddenFrets, fretIndex),
    [hiddenFrets],
  );
  const visibleFrets = useMemo(
    () => buildRenderedFretIndices(frets, hiddenFrets),
    [frets, hiddenFrets],
  );
  const safeCapoFret = useMemo(
    () => resolveVisibleCapoFret(capoFret, visibleFrets),
    [capoFret, visibleFrets],
  );

  const betweenVisibleFretsXByFret = useMemo(() => {
    const xByFret = Array.from({ length: frets + 1 }, (_, fret) =>
      betweenFretsX(fret),
    );
    if (frets < 1) return xByFret;

    let prevVisible = 0;
    let visibleIndex = 0;
    const visibleCount = visibleFrets.length;

    for (let fret = 1; fret <= frets; fret += 1) {
      while (visibleIndex < visibleCount && visibleFrets[visibleIndex] < fret) {
        prevVisible = visibleFrets[visibleIndex];
        visibleIndex += 1;
      }

      if (visibleIndex < visibleCount && visibleFrets[visibleIndex] === fret) {
        xByFret[fret] = (wireX(prevVisible) + wireX(fret)) / 2;
      }
    }

    return xByFret;
  }, [frets, betweenFretsX, visibleFrets, wireX]);

  const betweenVisibleFretsX = useCallback(
    (fret) => betweenVisibleFretsXByFret[fret] ?? betweenFretsX(fret),
    [betweenVisibleFretsXByFret, betweenFretsX],
  );

  useEffect(() => {
    reconcileCapoState(capoFret, safeCapoFret, onSetCapo);
  }, [capoFret, safeCapoFret, onSetCapo]);

  const chromaticIntervals = useMemo(
    () => Array.from({ length: Math.max(1, system.divisions) }, (_, i) => i),
    [system.divisions],
  );
  const activeIntervals =
    Array.isArray(intervals) && intervals.length > 0
      ? intervals
      : chromaticIntervals;
  const showNoScaleMessage = activeIntervals.length === 0;

  const { scaleSet, degreeForPc } = useScaleAndChord({
    system,
    rootIx,
    intervals: activeIntervals,
    chordPCs,
    chordRootPc,
  });

  const { inlaySingles, inlayDoubles } = useInlays({
    frets,
    divisions: system.divisions,
  });

  const { labelFor } = useLabels({
    mode: show,
    system,
    rootIx,
    degreeForPc,
    nameForPc,
    accidental,
  });

  const metaByIndex = useMemo(() => toStringMetaMap(stringMeta), [stringMeta]);

  const microLabelOpts = useMemo(
    () => ({
      microStyle: microLabelStyle ?? MICRO_LABEL_STYLES.Letters,
      accidental,
    }),
    [microLabelStyle, accidental],
  );
  const textFit = useMemo(
    () => createTextFit({ fontFamily: APP_FONT_STACK }),
    [],
  );
  const typographyCaches = useMemo(
    () => ({
      fitByConfig: new Map(),
      widthByTextStyle: new Map(),
    }),
    [
      microLabelStyle,
      system.divisions,
      width,
      frets,
      strings,
      dotSize,
      notePlacementMode,
    ],
  );

  const fitLabelCached = useCallback(
    (variants, maxWidth, options) => {
      const cacheKey = buildFitCacheKey({
        variants,
        maxWidth,
        minFontSize: options.sizeRange.min,
        maxFontSize: options.sizeRange.max,
        step: options.sizeRange.step,
        fontWeight: options.fontWeight,
        allowSingleCharFallback: options.allowSingleCharFallback,
      });
      if (typographyCaches.fitByConfig.has(cacheKey)) {
        return typographyCaches.fitByConfig.get(cacheKey);
      }
      const fit = textFit.fitLabel(variants, maxWidth, options);
      typographyCaches.fitByConfig.set(cacheKey, fit ?? null);
      return fit;
    },
    [textFit, typographyCaches],
  );

  const measureWidthCached = useCallback(
    (label, options) => {
      const cacheKey = buildWidthCacheKey({
        label,
        fontSize: options.fontSize,
        fontWeight: options.fontWeight,
      });
      if (typographyCaches.widthByTextStyle.has(cacheKey)) {
        return typographyCaches.widthByTextStyle.get(cacheKey);
      }
      const measuredWidth = textFit.measureWidth(label, options);
      typographyCaches.widthByTextStyle.set(cacheKey, measuredWidth);
      return measuredWidth;
    },
    [textFit, typographyCaches],
  );
  const openPcByString = useMemo(() => {
    const N = Math.max(1, system.divisions);
    const out = Array.from({ length: strings }, () => 0);

    for (let s = 0; s < strings; s += 1) {
      const sf = startFretFor(s);
      out[s] = (pcForName(tuning[s]) + sf) % N;
    }

    return out;
  }, [strings, tuning, startFretFor, system.divisions, pcForName]);

  const noteGeometry = useMemo(() => {
    const out = [];
    for (let s = 0; s < strings; s += 1) {
      const sf = startFretFor(s);
      const cy = yForString(s);
      for (let f = 0; f <= frets; f += 1) {
        if (isFretHidden(f)) continue;
        const isOpen = f === 0;
        const isPlayable = sf === 0 ? true : isOpen ? true : f > sf;
        if (!isPlayable) continue;
        const cx = isOpen
          ? openXForString(s)
          : notePlacementMode === "onFret"
            ? wireX(f)
            : betweenVisibleFretsX(f);
        const step = isOpen ? 0 : sf === 0 ? f : f - sf;
        out.push({
          key: `${s}-${f}`,
          s,
          f,
          sf,
          step,
          cy,
          cx,
          isOpen,
        });
      }
    }
    return out;
  }, [
    strings,
    frets,
    startFretFor,
    yForString,
    isFretHidden,
    openXForString,
    notePlacementMode,
    wireX,
    betweenVisibleFretsX,
  ]);

  const renderedNotes = useMemo(() => {
    if (!activeIntervals.length) return [];
    const N = system.divisions;
    const baseNotes = [];

    for (let i = 0; i < noteGeometry.length; i += 1) {
      const slot = noteGeometry[i];
      const pc = (openPcByString[slot.s] + slot.step) % N;
      const inScale = scaleSet.has(pc);
      const inChord = chordPCs ? chordPCs.has(pc) : false;
      const isOverlayOutsideScaleChord =
        Boolean(chordPCs) && !hideNonChord && inChord && !inScale;

      let visible;
      if (hideNonChord && chordPCs) {
        const baselineVisible = slot.isOpen ? showOpen : true;
        visible = baselineVisible && inChord;
      } else {
        const baselineVisible = slot.isOpen
          ? showOpen && (!openOnlyInScale || inScale)
          : inScale;
        visible = baselineVisible || isOverlayOutsideScaleChord;
      }
      if (!visible) continue;

      const isRoot = pc === rootIx;
      const isStandard = (slot.f * 12) % N === 0;
      const isMicro = !isStandard;
      const rBase = (isRoot ? ROOT_NOTE_RADIUS_MULTIPLIER : 1) * dotSize;
      const r = inChord ? rBase * CHORD_NOTE_RADIUS_MULTIPLIER : rBase;

      let fill;
      if (colorByDegree) {
        const deg = degreeForPc(pc);
        fill =
          deg != null
            ? getDegreeColor(deg, activeIntervals.length)
            : isMicro
              ? "var(--note-micro)"
              : "var(--note)";
      } else {
        fill = isRoot
          ? "var(--root)"
          : isMicro
            ? "var(--note-micro)"
            : "var(--note)";
      }

      const isChordRoot = inChord && chordRootPc === pc;
      const isChordOutsideScale = inChord && !inScale;
      if (isChordOutsideScale) fill = "var(--chord-outside-fill)";

      const globalFretForLabel = slot.isOpen ? slot.sf : slot.f;
      const raw = labelFor(pc, slot.f);
      const label =
        show === "fret"
          ? buildFretLabel(globalFretForLabel, N, microLabelOpts)
          : raw;

      baseNotes.push({
        ...slot,
        pc,
        isRoot,
        isStandard,
        isMicro,
        inChord,
        isChordRoot,
        isChordOutsideScale,
        r,
        fill,
        label,
      });
    }

    const sorted = [...baseNotes].sort((a, b) => {
      if (a.isRoot !== b.isRoot) return a.isRoot ? -1 : 1;
      if (a.inChord !== b.inChord) return a.inChord ? -1 : 1;
      return b.r - a.r;
    });
    const acceptedBoundsBuckets = new Map();
    const computed = new Map();

    for (let i = 0; i < sorted.length; i += 1) {
      const note = sorted[i];
      const noteVariants = buildLabelVariants(note.label ?? "", {
        kind: "note",
        allowSingleCharFallback: note.isRoot,
      });
      const fit = fitLabelCached(noteVariants, note.r * 1.65, {
        sizeRange: {
          min: NOTE_FONT_MIN,
          max: NOTE_FONT_MAX,
          step: 0.5,
        },
        fontWeight: 700,
        allowSingleCharFallback: note.isRoot,
      });

      if (!fit) {
        computed.set(note.key, { ...note, renderedLabel: null });
        continue;
      }

      const width = measureWidthCached(fit.text, {
        fontSize: fit.fontSize,
        fontWeight: 700,
      });
      const halfW = width / 2 + 1;
      const halfH = fit.fontSize / 2 + 1;
      const bounds = {
        left: note.cx - halfW,
        right: note.cx + halfW,
        top: note.cy - halfH,
        bottom: note.cy + halfH,
      };
      const collides = collides2D(
        bounds,
        acceptedBoundsBuckets,
        SPATIAL_BUCKET_SIZE,
      );

      if (collides && !note.isRoot) {
        computed.set(note.key, { ...note, renderedLabel: null });
        continue;
      }

      addBounds2D(bounds, acceptedBoundsBuckets, SPATIAL_BUCKET_SIZE);
      computed.set(note.key, {
        ...note,
        renderedLabel: fit.text,
        noteFontSize: fit.fontSize,
      });
    }

    return baseNotes.map((note) => computed.get(note.key) ?? note);
  }, [
    activeIntervals,
    system.divisions,
    noteGeometry,
    openPcByString,
    scaleSet,
    chordPCs,
    chordRootPc,
    showOpen,
    openOnlyInScale,
    hideNonChord,
    rootIx,
    dotSize,
    colorByDegree,
    degreeForPc,
    labelFor,
    show,
    microLabelOpts,
    fitLabelCached,
    measureWidthCached,
  ]);

  const fretMarkers = useMemo(() => {
    const baseMarkers = visibleFrets.map((f, index) => {
      const labelNum = buildFretLabel(f, system.divisions, microLabelOpts);
      const xForFretNum = betweenVisibleFretsX(f);

      const leftBoundary =
        index === 0 ? padLeft : (wireX(visibleFrets[index - 1]) + wireX(f)) / 2;
      const rightBoundary =
        index === visibleFrets.length - 1
          ? boardEndX
          : (wireX(f) + wireX(visibleFrets[index + 1])) / 2;
      const fit = fitLabelCached(
        buildLabelVariants(labelNum, {
          kind: "fret",
          allowSingleCharFallback: false,
        }),
        Math.max(6, (rightBoundary - leftBoundary) * 0.9),
        {
          sizeRange: {
            min: MARKER_FONT_MIN,
            max: MARKER_FONT_MAX,
            step: 0.5,
          },
          fontWeight: 500,
          allowSingleCharFallback: false,
        },
      );

      return {
        fret: f,
        xForFretNum,
        maxWidth: Math.max(6, (rightBoundary - leftBoundary) * 0.9),
        labelNum: fit?.text ?? null,
        markerFontSize: fit?.fontSize ?? MARKER_FONT_MIN,
      };
    });

    const acceptedBoundsBuckets = new Map();
    return baseMarkers.map((marker) => {
      if (!marker.labelNum) return marker;
      const buildBounds = (label, fontSize) => {
        const width = measureWidthCached(label, {
          fontSize,
          fontWeight: 500,
        });
        return {
          left: marker.xForFretNum - width / 2 - 1,
          right: marker.xForFretNum + width / 2 + 1,
        };
      };

      let nextLabel = marker.labelNum;
      let nextSize = marker.markerFontSize;
      let bounds = buildBounds(nextLabel, nextSize);
      let collides = collides1D(
        bounds,
        acceptedBoundsBuckets,
        SPATIAL_BUCKET_SIZE,
      );

      if (collides && marker.fret !== safeCapoFret) {
        const downgradedFit = fitLabelCached(
          buildLabelVariants(marker.labelNum, {
            kind: "fret",
            allowSingleCharFallback: false,
          }),
          marker.maxWidth,
          {
            sizeRange: {
              min: MARKER_FONT_MIN,
              max: Math.max(MARKER_FONT_MIN, marker.markerFontSize - 1.5),
              step: 0.5,
            },
            fontWeight: 500,
            allowSingleCharFallback: false,
          },
        );

        if (!downgradedFit) {
          return { ...marker, labelNum: null };
        }

        nextLabel = downgradedFit.text;
        nextSize = downgradedFit.fontSize;
        bounds = buildBounds(nextLabel, nextSize);
        collides = collides1D(
          bounds,
          acceptedBoundsBuckets,
          SPATIAL_BUCKET_SIZE,
        );
        if (collides) {
          return { ...marker, labelNum: null };
        }
      }

      addBounds1D(bounds, acceptedBoundsBuckets, SPATIAL_BUCKET_SIZE);
      return {
        ...marker,
        labelNum: nextLabel,
        markerFontSize: nextSize,
      };
    });
  }, [
    visibleFrets,
    system.divisions,
    microLabelOpts,
    betweenVisibleFretsX,
    padLeft,
    boardEndX,
    fitLabelCached,
    measureWidthCached,
    safeCapoFret,
  ]);

  const resolveNotePcFromTarget = useCallback((target) => {
    const noteElement = resolveClosestDatasetElement(target, "[data-note-pc]");
    return parseDatasetNumber(noteElement, "notePc");
  }, []);

  const handleDelegatedNoteClick = useCallback(
    (event) => {
      if (!onSelectNote) return;
      const pc = resolveNotePcFromTarget(event.target);
      if (pc == null) return;
      const noteName = nameForPc(pc);
      onSelectNote(pc, noteName, event);
    },
    [nameForPc, onSelectNote, resolveNotePcFromTarget],
  );

  const handleDelegatedNoteContextMenu = useCallback(
    (event) => {
      if (!onSelectNote) return;
      const pc = resolveNotePcFromTarget(event.target);
      if (pc == null) return;
      maybePreventContextMenu(event, true);
      const noteName = nameForPc(pc);
      onSelectNote(pc, noteName, event);
    },
    [nameForPc, onSelectNote, resolveNotePcFromTarget],
  );

  return (
    <svg
      ref={svgRef}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      onClick={handleDelegatedNoteClick}
      onContextMenu={handleDelegatedNoteContextMenu}
    >
      <g transform={lefty ? `scale(-1,1) translate(-${width},0)` : undefined}>
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx={PANEL_CORNER_RADIUS}
          fill="var(--panel)"
        />

        <rect
          className="tv-fretboard__nut"
          x={wireX(safeCapoFret)}
          y={padTop - NUT_VERTICAL_PADDING}
          width={nutW}
          height={height - padTop - padBottom + NUT_VERTICAL_PADDING * 2}
          rx="2"
        />

        {Array.from({ length: strings }).map((_, s) => {
          const y = yForString(s);
          const startX = stringStartX(s);
          const meta = metaByIndex.get(s);
          const hasGreyStub = !!meta?.greyBefore && startFretFor(s) > 0;

          return (
            <g key={`string-${s}`}>
              {hasGreyStub && (
                <line
                  x1={padLeft}
                  y1={y}
                  x2={startX}
                  y2={y}
                  className={clsx(
                    "tv-fretboard__string",
                    "tv-fretboard__string--ghost",
                  )}
                />
              )}
              <line
                x1={startX}
                y1={y}
                x2={boardEndX}
                y2={y}
                className="tv-fretboard__string"
              />
            </g>
          );
        })}

        {visibleFrets.map((f) => {
          const isOctave = f % system.divisions === 0;
          const isStandard = (f * 12) % system.divisions === 0;
          const isMicro = !isStandard;
          return (
            <line
              key={`fret-${f}`}
              x1={wireX(f)}
              y1={padTop}
              x2={wireX(f)}
              y2={height - padBottom}
              className={clsx("tv-fretboard__fret", {
                "tv-fretboard__fret--strong": isOctave,
                "tv-fretboard__fret--micro": isMicro,
                "tv-fretboard__fret--dotted": fretStyle === "dotted" && f > 0,
              })}
            />
          );
        })}

        {inlaySingles.map((f) => {
          if (isFretHidden(f)) return null;

          const prev = f === 1 ? 0 : fretXs[f - 2];
          const curr = fretXs[f - 1];
          const cx = padLeft + nutW + (prev + curr) / 2;
          const cy = padTop + (height - padTop - padBottom) / 2;
          return (
            <circle
              key={`inlay-s-${f}`}
              className="tv-fretboard__inlay"
              cx={cx}
              cy={cy}
              r={INLAY_RADIUS}
            />
          );
        })}

        {inlayDoubles.map((f) => {
          if (isFretHidden(f)) return null;

          const prev = f === 1 ? 0 : fretXs[f - 2];
          const curr = fretXs[f - 1];
          const cx = padLeft + nutW + (prev + curr) / 2;
          const cy1 =
            padTop +
            (height - padTop - padBottom) / 2 -
            DOUBLE_INLAY_VERTICAL_OFFSET;
          const cy2 =
            padTop +
            (height - padTop - padBottom) / 2 +
            DOUBLE_INLAY_VERTICAL_OFFSET;
          return (
            <g key={`inlay-d-${f}`}>
              <circle
                className="tv-fretboard__inlay"
                cx={cx}
                cy={cy1}
                r={INLAY_RADIUS}
              />
              <circle
                className="tv-fretboard__inlay"
                cx={cx}
                cy={cy2}
                r={INLAY_RADIUS}
              />
            </g>
          );
        })}

        {renderedNotes.map((n) => (
          <circle
            key={`noteCirc-${n.key}`}
            data-note-pc={n.pc}
            cx={n.cx}
            cy={n.cy}
            r={n.r}
            fill={n.fill}
            stroke={
              n.inChord
                ? n.isChordOutsideScale
                  ? "var(--chord-outside-stroke)"
                  : "var(--fg)"
                : "none"
            }
            strokeWidth={
              n.isChordRoot
                ? CHORD_ROOT_STROKE_WIDTH
                : n.inChord
                  ? n.isChordOutsideScale
                    ? CHORD_NOTE_STROKE_WIDTH * 0.7
                    : CHORD_NOTE_STROKE_WIDTH
                  : 0
            }
          />
        ))}
      </g>

      {renderedNotes.map((n) => {
        if (!n.renderedLabel) return null;
        return (
          <text
            key={`noteText-${n.key}`}
            data-note-pc={n.pc}
            className={clsx("tv-fretboard__note", {
              "tv-fretboard__note--root": n.isRoot,
            })}
            x={displayX(n.cx)}
            y={n.cy + (n.noteFontSize ?? NOTE_FONT_MAX) * 0.33}
            textAnchor="middle"
            fontSize={n.noteFontSize ?? undefined}
          >
            {n.renderedLabel}
          </text>
        );
      })}

      {showFretNums &&
        fretMarkers.map(
          ({ fret: f, xForFretNum, labelNum, markerFontSize }) => {
            if (!labelNum) return null;
            const bottomY = height - padBottom + FRETNUM_BOTTOM_GAP;
            const topY = padTop - FRETNUM_TOP_GAP;
            const isStandard = (f * 12) % system.divisions === 0;

            const commonProps = {
              role: "button",
              tabIndex: 0,
              onClick: () => onSetCapo(f),
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSetCapo(f);
                }
              },
              className: clsx("tv-fretboard__marker", {
                "tv-fretboard__marker--capo": f === safeCapoFret,
                "tv-fretboard__marker--micro": !isStandard,
              }),
            };

            return (
              <text
                key={`num-${f}`}
                x={displayX(xForFretNum)}
                y={isStandard ? bottomY : topY}
                textAnchor="middle"
                fontSize={markerFontSize}
                {...commonProps}
              >
                {labelNum}
              </text>
            );
          },
        )}

      {showNoScaleMessage && (
        <text
          className="tv-stage__empty"
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          No scale selected
        </text>
      )}
    </svg>
  );
});

function areFretboardPropsEqual(prev, next) {
  if (!Object.is(prev.strings, next.strings)) return false;
  if (!Object.is(prev.frets, next.frets)) return false;
  if (!Object.is(prev.rootIx, next.rootIx)) return false;
  if (!Object.is(prev.accidental, next.accidental)) return false;
  if (!Object.is(prev.noteNaming, next.noteNaming)) return false;
  if (!Object.is(prev.microLabelStyle, next.microLabelStyle)) return false;
  if (!Object.is(prev.show, next.show)) return false;
  if (!Object.is(prev.showOpen, next.showOpen)) return false;
  if (!Object.is(prev.showFretNums, next.showFretNums)) return false;
  if (!Object.is(prev.dotSize, next.dotSize)) return false;
  if (!Object.is(prev.lefty, next.lefty)) return false;
  if (!Object.is(prev.openOnlyInScale, next.openOnlyInScale)) return false;
  if (!Object.is(prev.colorByDegree, next.colorByDegree)) return false;
  if (!Object.is(prev.hideNonChord, next.hideNonChord)) return false;
  if (!Object.is(prev.capoFret, next.capoFret)) return false;
  if (!Object.is(prev.chordRootPc, next.chordRootPc)) return false;
  if (!Object.is(prev.onSelectNote, next.onSelectNote)) return false;
  if (!Object.is(prev.onSetCapo, next.onSetCapo)) return false;

  if (!objectRefAndKeyEqual(prev.system, next.system, "id")) return false;
  if (!objectRefAndKeyEqual(prev.system, next.system, "divisions")) {
    return false;
  }
  if (!arrayRefAndLengthEqual(prev.intervals, next.intervals)) return false;
  if (!arrayRefAndLengthEqual(prev.tuning, next.tuning)) return false;
  if (!arrayRefAndLengthEqual(prev.stringMeta, next.stringMeta)) return false;

  if (!objectRefAndKeyEqual(prev.boardMeta, next.boardMeta, "notePlacement")) {
    return false;
  }
  if (!objectRefAndKeyEqual(prev.boardMeta, next.boardMeta, "fretStyle")) {
    return false;
  }
  if (
    !arrayRefAndLengthEqual(
      prev.boardMeta?.hiddenFrets,
      next.boardMeta?.hiddenFrets,
    )
  ) {
    return false;
  }
  if (!setRefAndSizeEqual(prev.chordPCs, next.chordPCs)) return false;

  return true;
}

const FretboardMemo = memo(Fretboard, areFretboardPropsEqual);

export default FretboardMemo;
