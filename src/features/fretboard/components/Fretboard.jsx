import {
  memo,
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
import { MICRO_LABEL_STYLES } from "@shared/lib/fretLabels";
import {
  arrayRefAndLengthEqual,
  keysIdentical,
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
  buildBetweenVisibleFretsX,
  buildFretMarkers,
  buildNoteGeometry,
  buildOpenPcByString,
  buildRenderedNotes,
} from "@features/fretboard/model/boardLayout";
import {
  NoteCircle,
  NoteLabel,
} from "@features/fretboard/components/FretboardNote";

const PANEL_CORNER_RADIUS = 14;
const INLAY_RADIUS = 6.5;
const DOUBLE_INLAY_VERTICAL_OFFSET = 14;
const NUT_VERTICAL_PADDING = 8;
const APP_FONT_STACK =
  'Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';

function getOrCompute(cache, key, compute) {
  if (cache.has(key)) return cache.get(key);
  const value = compute();
  cache.set(key, value);
  return value;
}

function Fretboard({
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
  showAllNotes = false,
  stringMeta,
  boardMeta,

  onSelectNote,
  capoFret,
  onSetCapo = () => {},
  ref,
}) {
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

  const betweenVisibleFretsXByFret = useMemo(
    () =>
      buildBetweenVisibleFretsX({
        frets,
        visibleFrets,
        betweenFretsX,
        wireX,
        capoFret: safeCapoFret,
        nutW,
      }),
    [frets, betweenFretsX, visibleFrets, wireX, safeCapoFret, nutW],
  );

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
      return getOrCompute(
        typographyCaches.fitByConfig,
        cacheKey,
        () => textFit.fitLabel(variants, maxWidth, options) ?? null,
      );
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
      return getOrCompute(typographyCaches.widthByTextStyle, cacheKey, () =>
        textFit.measureWidth(label, options),
      );
    },
    [textFit, typographyCaches],
  );
  const openPcByString = useMemo(
    () =>
      buildOpenPcByString({
        strings,
        tuning,
        startFretFor,
        divisions: system.divisions,
        pcForName,
      }),
    [strings, tuning, startFretFor, system.divisions, pcForName],
  );

  const noteGeometry = useMemo(
    () =>
      buildNoteGeometry({
        strings,
        frets,
        startFretFor,
        yForString,
        isFretHidden,
        openXForString,
        notePlacementMode,
        wireX,
        betweenVisibleFretsX,
      }),
    [
      strings,
      frets,
      startFretFor,
      yForString,
      isFretHidden,
      openXForString,
      notePlacementMode,
      wireX,
      betweenVisibleFretsX,
    ],
  );

  const renderedNotes = useMemo(
    () =>
      buildRenderedNotes({
        noteGeometry,
        openPcByString,
        divisions: system.divisions,
        strings,
        accidental,
        activeIntervals,
        scaleSet,
        rootIx,
        chordPCs,
        chordRootPc,
        display: {
          show,
          showOpen,
          hideNonChord,
          openOnlyInMode,
          showAllNotes,
          colorByDegree,
          colorByShape,
        },
        dotSize: effectiveDotSize,
        degreeForPc,
        labelFor,
        microLabelOpts,
        fitLabel: fitLabelCached,
        measureWidth: measureWidthCached,
      }),
    [
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
      showAllNotes,
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
    ],
  );

  const fretMarkers = useMemo(
    () =>
      buildFretMarkers({
        visibleFrets,
        divisions: system.divisions,
        microLabelOpts,
        betweenVisibleFretsX,
        padLeft,
        boardEndX,
        wireX,
        capoFret: safeCapoFret,
        fitLabel: fitLabelCached,
        measureWidth: measureWidthCached,
      }),
    [
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
    ],
  );

  const selectNoteFromEvent = useCallback(
    (event, { preventContextMenu = false } = {}) => {
      if (!onSelectNote) return;
      const noteElement = resolveClosestDatasetElement(
        event.target,
        "[data-note-pc]",
      );
      const pc = parseDatasetNumber(noteElement, "notePc");
      if (pc == null) return;
      if (preventContextMenu) maybePreventContextMenu(event, true);
      onSelectNote(pc, nameForPc(pc), event);
    },
    [nameForPc, onSelectNote],
  );
  const handleDelegatedNoteClick = selectNoteFromEvent;
  const handleDelegatedNoteContextMenu = useCallback(
    (event) => selectNoteFromEvent(event, { preventContextMenu: true }),
    [selectNoteFromEvent],
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
            <g
              // eslint-disable-next-line @eslint-react/no-array-index-key -- strings are identified by position
              key={`string-${s}`}
            >
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

        {renderedNotes.map((n) => (
          <NoteCircle key={`noteCirc-${n.key}`} note={n} />
        ))}
      </g>

      {renderedNotes.map((n) => (
        <NoteLabel key={`noteText-${n.key}`} note={n} x={displayX(n.cx)} />
      ))}

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
}

// Props compared by identity; the rest below use cheaper structural checks
// (arrays/sets by ref+length, objects by the specific keys Fretboard reads).
const IDENTITY_PROPS = [
  "strings",
  "frets",
  "rootIx",
  "accidental",
  "noteNaming",
  "microLabelStyle",
  "show",
  "showOpen",
  "showFretNums",
  "dotSize",
  "lefty",
  "openOnlyInMode",
  "colorByDegree",
  "colorByShape",
  "hideNonChord",
  "showAllNotes",
  "capoFret",
  "chordRootPc",
  "onSelectNote",
  "onSetCapo",
  "ref",
];

function areFretboardPropsEqual(prev, next) {
  return (
    keysIdentical(prev, next, IDENTITY_PROPS) &&
    objectRefAndKeyEqual(prev.system, next.system, "id") &&
    objectRefAndKeyEqual(prev.system, next.system, "divisions") &&
    arrayRefAndLengthEqual(prev.intervals, next.intervals) &&
    arrayRefAndLengthEqual(prev.tuning, next.tuning) &&
    arrayRefAndLengthEqual(prev.stringMeta, next.stringMeta) &&
    objectRefAndKeyEqual(prev.boardMeta, next.boardMeta, "notePlacement") &&
    objectRefAndKeyEqual(prev.boardMeta, next.boardMeta, "fretStyle") &&
    arrayRefAndLengthEqual(
      prev.boardMeta?.hiddenFrets,
      next.boardMeta?.hiddenFrets,
    ) &&
    setRefAndSizeEqual(prev.chordPCs, next.chordPCs)
  );
}

const FretboardMemo = memo(Fretboard, areFretboardPropsEqual);

export default FretboardMemo;
