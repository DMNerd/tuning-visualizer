import {
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
import { makeDisplayX } from "@/utils/displayX";
import { buildFretLabel, MICRO_LABEL_STYLES } from "@/utils/fretLabels";
import { memoWithPick } from "@/utils/memo";
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

  const displayX = makeDisplayX(lefty, width);

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
  const betweenVisibleFretsX = useCallback(
    (f) => {
      if (f === 0) return betweenFretsX(0);

      let prevVisible = 0;
      for (let i = 0; i < visibleFrets.length; i += 1) {
        const current = visibleFrets[i];
        if (current >= f) {
          return (wireX(prevVisible) + wireX(f)) / 2;
        }
        prevVisible = current;
      }

      return betweenFretsX(f);
    },
    [betweenFretsX, visibleFrets, wireX],
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
        out.push({
          key: `${s}-${f}`,
          s,
          f,
          sf,
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
      const openPc = (pcForName(tuning[slot.s]) + slot.sf) % N;
      const step = slot.isOpen ? 0 : slot.sf === 0 ? slot.f : slot.f - slot.sf;
      const pc = (openPc + step) % N;
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
      const fit = textFit.fitLabel(noteVariants, note.r * 1.65, {
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

      const width = textFit.measureWidth(fit.text, {
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
    tuning,
    pcForName,
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
    textFit,
  ]);

  const fretMarkers = useMemo(() => {
    const baseMarkers = visibleFrets.map((f, index) => {
      const labelNum = buildFretLabel(f, system.divisions, microLabelOpts);
      const xForFretNum =
        notePlacementMode === "onFret" ? wireX(f) : betweenVisibleFretsX(f);

      const leftBoundary =
        index === 0 ? padLeft : (wireX(visibleFrets[index - 1]) + wireX(f)) / 2;
      const rightBoundary =
        index === visibleFrets.length - 1
          ? boardEndX
          : (wireX(f) + wireX(visibleFrets[index + 1])) / 2;
      const fit = textFit.fitLabel(
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
        const width = textFit.measureWidth(label, {
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
        const downgradedFit = textFit.fitLabel(
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
    notePlacementMode,
    wireX,
    betweenVisibleFretsX,
    padLeft,
    boardEndX,
    textFit,
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

/* =========================
  Memo comparator using dequal
========================= */

function pickRenderProps(p) {
  return {
    strings: p.strings,
    frets: p.frets,
    rootIx: p.rootIx,
    accidental: p.accidental,
    noteNaming: p.noteNaming,
    microLabelStyle: p.microLabelStyle,
    show: p.show,
    showOpen: p.showOpen,
    showFretNums: p.showFretNums,
    dotSize: p.dotSize,
    lefty: p.lefty,
    openOnlyInScale: p.openOnlyInScale,
    colorByDegree: p.colorByDegree,
    hideNonChord: p.hideNonChord,
    capoFret: p.capoFret,
    system: p.system,
    tuning: p.tuning,
    intervals: p.intervals,
    chordPCs: p.chordPCs,
    chordRootPc: p.chordRootPc,
    stringMeta: p.stringMeta,
    boardMeta: p.boardMeta,
    onSelectNote: p.onSelectNote,
    onSetCapo: p.onSetCapo,
  };
}

const FretboardMemo = memoWithPick(Fretboard, pickRenderProps);

export default FretboardMemo;
