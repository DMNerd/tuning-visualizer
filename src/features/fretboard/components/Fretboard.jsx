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
import { useFretboardLayout } from "@features/fretboard/hooks/useFretboardLayout";
import { useSystemNoteNames } from "@features/theory/hooks/useSystemNoteNames";
import { useScaleAndChord } from "@features/theory/hooks/useScaleAndChord";
import { useInlays } from "@features/fretboard/hooks/useInlays";
import { useLabels } from "@features/fretboard/hooks/useLabels";
import { buildFretLabel, MICRO_LABEL_STYLES } from "@shared/lib/fretLabels";
import {
  arrayRefAndLengthEqual,
  objectRefAndKeyEqual,
  setRefAndSizeEqual,
} from "@shared/lib/memo";
import { createTextFit } from "@shared/lib/textFit";
import {
  maybePreventContextMenu,
  parseDatasetNumber,
  resolveClosestDatasetElement,
} from "@shared/lib/svgDelegation";
import {
  NOTE_FONT_MAX,
  SPLIT_NOTE_FONT_MIN,
  MARKER_FONT_MIN,
  MARKER_FONT_MAX,
  estimateMinimumDotSize,
  buildFitCacheKey,
  buildWidthCacheKey,
} from "@features/fretboard/model/labelFit";
import {
  normalizeHiddenFrets,
  isHiddenFret,
  buildRenderedFretIndices,
  resolveVisibleCapoFret,
  reconcileCapoState,
} from "@features/fretboard/model/renderFilters";
import {
  isNoteVisible,
  resolveNoteFill,
} from "@features/fretboard/model/noteAppearance";
import { applyShapeRegionColors } from "@features/fretboard/model/shapeRegions";
import {
  placeNoteLabels,
  placeFretMarkerLabels,
  fitFretMarkerLabel,
} from "@features/fretboard/model/labelPlacement";

const ROOT_NOTE_RADIUS_MULTIPLIER = 1.1;
const CHORD_NOTE_RADIUS_MULTIPLIER = 1.05;
const CHORD_ROOT_STROKE_WIDTH = 2.4;
const CHORD_NOTE_STROKE_WIDTH = 1.8;
const PANEL_CORNER_RADIUS = 14;
const INLAY_RADIUS = 6.5;
const DOUBLE_INLAY_VERTICAL_OFFSET = 14;
const NUT_VERTICAL_PADDING = 8;
const APP_FONT_STACK =
  'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

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
    openOnlyInMode,
    colorByDegree,
    colorByShape,
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
  const textFit = useMemo(
    () => createTextFit({ fontFamily: APP_FONT_STACK }),
    [],
  );

  const { pcFromName, nameForPc } = useSystemNoteNames(
    system,
    accidental,
    noteNaming,
  );
  const minimumDotSize = useMemo(
    () =>
      estimateMinimumDotSize({
        textFit,
        divisions: Math.max(1, system.divisions),
        nameForPc,
        accidental,
      }),
    [textFit, system.divisions, nameForPc, accidental],
  );
  const effectiveDotSize = Math.max(dotSize, minimumDotSize);

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
    metaByIndex,
  } = useFretboardLayout({
    frets,
    strings,
    dotSize: effectiveDotSize,
    stringMeta,
  });

  useLayoutEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.setAttribute("viewBox", `0 0 ${width} ${height}`);
    if (typeof ref === "function") ref(svgRef.current);
    else if (ref) ref.current = svgRef.current;
  }, [ref, width, height]);

  const displayX = (x) => (lefty ? width - x : x);

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

  const microLabelOpts = useMemo(
    () => ({
      microStyle: microLabelStyle ?? MICRO_LABEL_STYLES.Letters,
      accidental,
    }),
    [microLabelStyle, accidental],
  );
  const typographyCacheScope = `${microLabelStyle}:${system.divisions}:${width}:${frets}:${strings}:${effectiveDotSize}:${notePlacementMode}`;
  const typographyCaches = useMemo(
    () => ({
      scope: typographyCacheScope,
      fitByConfig: new Map(),
      widthByTextStyle: new Map(),
    }),
    [typographyCacheScope],
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
    const hasChord = Boolean(chordPCs);
    const baseNotes = [];

    for (const slot of noteGeometry) {
      const pc = (openPcByString[slot.s] + slot.step) % N;
      const inScale = scaleSet.has(pc);
      const inChord = hasChord && chordPCs.has(pc);
      const visible = isNoteVisible({
        isOpen: slot.isOpen,
        inScale,
        inChord,
        hasChord,
        showOpen,
        hideNonChord,
        openOnlyInMode,
      });
      if (!visible) continue;

      const isRoot = pc === rootIx;
      // Open notes always have slot.f === 0, which would always read as
      // "standard" — for a string whose true position is offset by
      // stringMeta.startFret (non-12-TET partial-fret setups), the open
      // note's actual fret is slot.sf, matching the correction the label
      // below needs too, so both share this one computation.
      const globalFretForLabel = slot.isOpen ? slot.sf : slot.f;
      const isStandard = (globalFretForLabel * 12) % N === 0;
      const isMicro = !isStandard;
      const rBase =
        (isRoot ? ROOT_NOTE_RADIUS_MULTIPLIER : 1) * effectiveDotSize;
      const r = inChord ? rBase * CHORD_NOTE_RADIUS_MULTIPLIER : rBase;
      const isChordRoot = inChord && chordRootPc === pc;
      const isChordOutsideScale = inChord && !inScale;
      const fill = resolveNoteFill({
        colorByDegree,
        degree: colorByDegree ? degreeForPc(pc) : null,
        degreeCount: activeIntervals.length,
        isRoot,
        isMicro,
        isChordOutsideScale,
      });
      const label =
        show === "fret"
          ? buildFretLabel(globalFretForLabel, N, microLabelOpts)
          : labelFor(pc, slot.f);

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

    if (colorByShape) {
      applyShapeRegionColors(baseNotes, { divisions: N, strings, rootIx });
    }

    return placeNoteLabels(baseNotes, {
      splitEnharmonic: accidental === "both" && show === "names",
      fitLabel: fitLabelCached,
      measureWidth: measureWidthCached,
    });
  }, [
    activeIntervals,
    system.divisions,
    noteGeometry,
    openPcByString,
    scaleSet,
    chordPCs,
    chordRootPc,
    showOpen,
    openOnlyInMode,
    hideNonChord,
    rootIx,
    effectiveDotSize,
    colorByDegree,
    colorByShape,
    degreeForPc,
    labelFor,
    show,
    microLabelOpts,
    accidental,
    strings,
    fitLabelCached,
    measureWidthCached,
  ]);

  const fretMarkers = useMemo(() => {
    const baseMarkers = visibleFrets.map((f, index) => {
      const leftBoundary =
        index === 0 ? padLeft : (wireX(visibleFrets[index - 1]) + wireX(f)) / 2;
      const rightBoundary =
        index === visibleFrets.length - 1
          ? boardEndX
          : (wireX(f) + wireX(visibleFrets[index + 1])) / 2;
      const maxWidth = Math.max(6, (rightBoundary - leftBoundary) * 0.9);
      const fit = fitFretMarkerLabel(
        fitLabelCached,
        buildFretLabel(f, system.divisions, microLabelOpts),
        maxWidth,
        MARKER_FONT_MAX,
      );

      return {
        fret: f,
        xForFretNum: betweenVisibleFretsX(f),
        maxWidth,
        labelNum: fit?.text ?? null,
        markerFontSize: fit?.fontSize ?? MARKER_FONT_MIN,
      };
    });

    return placeFretMarkerLabels(baseMarkers, {
      capoFret: safeCapoFret,
      fitLabel: fitLabelCached,
      measureWidth: measureWidthCached,
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
    wireX,
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

  const inlayCenterX = (f) =>
    padLeft + nutW + ((f === 1 ? 0 : fretXs[f - 2]) + fretXs[f - 1]) / 2;
  const inlayCenterY = padTop + (height - padTop - padBottom) / 2;

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

          return (
            <circle
              key={`inlay-s-${f}`}
              className="tv-fretboard__inlay"
              cx={inlayCenterX(f)}
              cy={inlayCenterY}
              r={INLAY_RADIUS}
            />
          );
        })}

        {inlayDoubles.map((f) => {
          if (isFretHidden(f)) return null;

          const cx = inlayCenterX(f);
          const cy1 = inlayCenterY - DOUBLE_INLAY_VERTICAL_OFFSET;
          const cy2 = inlayCenterY + DOUBLE_INLAY_VERTICAL_OFFSET;
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

        {renderedNotes.map((n) => {
          const chordStroke = n.inChord
            ? n.isChordOutsideScale
              ? "var(--chord-outside-stroke)"
              : "var(--fg)"
            : "none";
          const chordStrokeWidth = n.isChordRoot
            ? CHORD_ROOT_STROKE_WIDTH
            : n.inChord
              ? n.isChordOutsideScale
                ? CHORD_NOTE_STROKE_WIDTH * 0.7
                : CHORD_NOTE_STROKE_WIDTH
              : 0;

          if (!n.splitEnharmonic && !n.splitByShape) {
            return (
              <circle
                key={`noteCirc-${n.key}`}
                data-note-pc={n.pc}
                cx={n.cx}
                cy={n.cy}
                r={n.r}
                fill={n.fill}
                stroke={chordStroke}
                strokeWidth={chordStrokeWidth}
              />
            );
          }

          const deriveLowerFill = (baseFill) =>
            `color-mix(in oklab, ${baseFill} 58%, var(--bg))`;

          return (
            <g key={`noteCirc-${n.key}`} data-note-pc={n.pc}>
              {n.splitEnharmonic && n.splitByShape
                ? (() => {
                    const leftFill = n.shapeSplitFills?.[0] ?? n.fill;
                    const rightFill = n.shapeSplitFills?.[1] ?? n.fill;
                    const lowerLeftFill = deriveLowerFill(leftFill);
                    const lowerRightFill = deriveLowerFill(rightFill);
                    const clipTopLeftId = `note-top-left-${n.key}`;
                    const clipTopRightId = `note-top-right-${n.key}`;
                    const clipBottomLeftId = `note-bottom-left-${n.key}`;
                    const clipBottomRightId = `note-bottom-right-${n.key}`;

                    return (
                      <>
                        <defs>
                          <clipPath id={clipTopLeftId}>
                            <rect
                              x={n.cx - n.r}
                              y={n.cy - n.r}
                              width={n.r}
                              height={n.r}
                            />
                          </clipPath>
                          <clipPath id={clipTopRightId}>
                            <rect
                              x={n.cx}
                              y={n.cy - n.r}
                              width={n.r}
                              height={n.r}
                            />
                          </clipPath>
                          <clipPath id={clipBottomLeftId}>
                            <rect
                              x={n.cx - n.r}
                              y={n.cy}
                              width={n.r}
                              height={n.r}
                            />
                          </clipPath>
                          <clipPath id={clipBottomRightId}>
                            <rect x={n.cx} y={n.cy} width={n.r} height={n.r} />
                          </clipPath>
                        </defs>
                        <circle
                          cx={n.cx}
                          cy={n.cy}
                          r={n.r}
                          fill={leftFill}
                          clipPath={`url(#${clipTopLeftId})`}
                        />
                        <circle
                          cx={n.cx}
                          cy={n.cy}
                          r={n.r}
                          fill={rightFill}
                          clipPath={`url(#${clipTopRightId})`}
                        />
                        <circle
                          cx={n.cx}
                          cy={n.cy}
                          r={n.r}
                          fill={lowerLeftFill}
                          clipPath={`url(#${clipBottomLeftId})`}
                        />
                        <circle
                          cx={n.cx}
                          cy={n.cy}
                          r={n.r}
                          fill={lowerRightFill}
                          clipPath={`url(#${clipBottomRightId})`}
                        />
                      </>
                    );
                  })()
                : n.splitByShape
                  ? (() => {
                      const leftFill = n.shapeSplitFills?.[0] ?? n.fill;
                      const rightFill =
                        n.shapeSplitFills?.[1] ?? deriveLowerFill(leftFill);
                      const clipLeftId = `note-left-${n.key}`;
                      const clipRightId = `note-right-${n.key}`;

                      return (
                        <>
                          <defs>
                            <clipPath id={clipLeftId}>
                              <rect
                                x={n.cx - n.r}
                                y={n.cy - n.r}
                                width={n.r}
                                height={n.r * 2}
                              />
                            </clipPath>
                            <clipPath id={clipRightId}>
                              <rect
                                x={n.cx}
                                y={n.cy - n.r}
                                width={n.r}
                                height={n.r * 2}
                              />
                            </clipPath>
                          </defs>
                          <circle
                            cx={n.cx}
                            cy={n.cy}
                            r={n.r}
                            fill={leftFill}
                            clipPath={`url(#${clipLeftId})`}
                          />
                          <circle
                            cx={n.cx}
                            cy={n.cy}
                            r={n.r}
                            fill={rightFill}
                            clipPath={`url(#${clipRightId})`}
                          />
                        </>
                      );
                    })()
                  : (() => {
                      const topFill = n.fill;
                      const bottomFill = deriveLowerFill(topFill);
                      const clipTopId = `note-top-${n.key}`;
                      const clipBottomId = `note-bottom-${n.key}`;

                      return (
                        <>
                          <defs>
                            <clipPath id={clipTopId}>
                              <rect
                                x={n.cx - n.r}
                                y={n.cy - n.r}
                                width={n.r * 2}
                                height={n.r}
                              />
                            </clipPath>
                            <clipPath id={clipBottomId}>
                              <rect
                                x={n.cx - n.r}
                                y={n.cy}
                                width={n.r * 2}
                                height={n.r}
                              />
                            </clipPath>
                          </defs>
                          <circle
                            cx={n.cx}
                            cy={n.cy}
                            r={n.r}
                            fill={topFill}
                            clipPath={`url(#${clipTopId})`}
                          />
                          <circle
                            cx={n.cx}
                            cy={n.cy}
                            r={n.r}
                            fill={bottomFill}
                            clipPath={`url(#${clipBottomId})`}
                          />
                        </>
                      );
                    })()}
              <circle
                cx={n.cx}
                cy={n.cy}
                r={n.r}
                fill="none"
                stroke={chordStroke}
                strokeWidth={chordStrokeWidth}
              />
            </g>
          );
        })}
      </g>

      {renderedNotes.map((n) => {
        if (!n.renderedLabel && !n.renderedLabelLines) return null;
        if (n.renderedLabelLines) {
          const [upper = "", lower = ""] = n.renderedLabelLines;
          const splitFontSize = n.noteFontSize ?? SPLIT_NOTE_FONT_MIN;
          const topY = n.cy - splitFontSize * 0.15;
          const bottomY = n.cy + splitFontSize * 0.9;
          const splitX = displayX(n.cx);
          return (
            <g key={`noteText-${n.key}`}>
              <text
                data-note-pc={n.pc}
                className={clsx("tv-fretboard__note", {
                  "tv-fretboard__note--root": n.isRoot,
                })}
                x={splitX}
                y={topY}
                textAnchor="middle"
                fontSize={splitFontSize}
              >
                {upper}
              </text>
              <text
                data-note-pc={n.pc}
                className={clsx("tv-fretboard__note", {
                  "tv-fretboard__note--root": n.isRoot,
                })}
                x={splitX}
                y={bottomY}
                textAnchor="middle"
                fontSize={splitFontSize}
              >
                {lower}
              </text>
            </g>
          );
        }
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
  if (!Object.is(prev.openOnlyInMode, next.openOnlyInMode)) return false;
  if (!Object.is(prev.colorByDegree, next.colorByDegree)) return false;
  if (!Object.is(prev.colorByShape, next.colorByShape)) return false;
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
