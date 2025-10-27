import { forwardRef, useLayoutEffect, useMemo, useRef } from "react";
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
import { toStringMetaMap } from "@/lib/meta/meta";

const Fretboard = forwardRef(function Fretboard(
  {
    strings,
    frets,
    tuning,
    rootIx,
    intervals,
    accidental,
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
    noteX,
  } = useFretboardLayout({ frets, strings, dotSize, stringMeta });

  useLayoutEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.setAttribute("viewBox", `0 0 ${width} ${height}`);
    if (typeof ref === "function") ref(svgRef.current);
    else if (ref) ref.current = svgRef.current;
  }, [ref, width, height]);

  const displayX = makeDisplayX(lefty, width);

  const { pcFromName, nameForPc } = useSystemNoteNames(system, accidental);
  const pcForName = pcFromName;

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

  const notes = useMemo(() => {
    if (!activeIntervals.length) return [];
    const out = [];
    const N = system.divisions;

    for (let s = 0; s < tuning.length; s++) {
      const openName = tuning[s];
      const sf = startFretFor(s);
      const openPc = (pcForName(openName) + sf) % N;
      const cy = yForString(s);

      for (let f = 0; f <= frets; f++) {
        const isOpen = f === 0;
        const isPlayable = sf === 0 ? true : isOpen ? true : f > sf;
        if (!isPlayable) continue;

        const step = isOpen ? 0 : sf === 0 ? f : f - sf;
        const pc = (openPc + step) % N;

        const inScale = scaleSet.has(pc);
        const inChord = chordPCs ? chordPCs.has(pc) : false;

        let visible;
        if (hideNonChord && chordPCs) {
          const baselineVisible = isOpen ? showOpen : true;
          visible = baselineVisible && inChord;
        } else {
          const baselineVisible = isOpen
            ? showOpen && (!openOnlyInScale || inScale)
            : inScale;
          visible = baselineVisible;
        }
        if (!visible) continue;

        const cx = isOpen ? openXForString(s) : noteX(f, s);

        const isRoot = pc === rootIx;
        const isStandard = (f * 12) % N === 0;
        const isMicro = !isStandard;

        const rBase = (isRoot ? 1.1 : 1) * dotSize;
        const r = inChord ? rBase * 1.05 : rBase;

        let fill;
        if (colorByDegree) {
          const deg = degreeForPc(pc);
          if (deg != null) {
            fill = getDegreeColor(deg, activeIntervals.length);
          } else {
            fill = isMicro ? "var(--note-micro)" : "var(--note)";
          }
        } else {
          fill = isRoot
            ? "var(--root)"
            : isMicro
              ? "var(--note-micro)"
              : "var(--note)";
        }

        const isChordRoot = inChord && chordRootPc === pc;

        const globalFretForLabel = isOpen ? sf : f;
        const raw = labelFor(pc, f);
        const label =
          show === "fret"
            ? buildFretLabel(globalFretForLabel, N, microLabelOpts)
            : raw;

        out.push({
          key: `${s}-${f}`,
          s,
          f,
          pc,
          cx,
          cy,
          isRoot,
          isStandard,
          isMicro,
          inChord,
          isChordRoot,
          r,
          fill,
          label,
        });
      }
    }

    return out;
  }, [
    activeIntervals,
    tuning,
    frets,
    system.divisions,
    startFretFor,
    yForString,
    openXForString,
    noteX,
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
  ]);

  return (
    <svg ref={svgRef} width="100%" preserveAspectRatio="xMidYMid meet">
      <g transform={lefty ? `scale(-1,1) translate(-${width},0)` : undefined}>
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx="14"
          fill="var(--panel)"
        />

        <rect
          className="tv-fretboard__nut"
          x={wireX(capoFret)}
          y={padTop - 8}
          width={nutW}
          height={height - padTop - padBottom + 16}
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

        {Array.from({ length: frets + 1 }).map((_, f) => {
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
              })}
            />
          );
        })}

        {inlaySingles.map((f) => {
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
              r="6.5"
            />
          );
        })}

        {inlayDoubles.map((f) => {
          const prev = f === 1 ? 0 : fretXs[f - 2];
          const curr = fretXs[f - 1];
          const cx = padLeft + nutW + (prev + curr) / 2;
          const cy1 = padTop + (height - padTop - padBottom) / 2 - 14;
          const cy2 = padTop + (height - padTop - padBottom) / 2 + 14;
          return (
            <g key={`inlay-d-${f}`}>
              <circle
                className="tv-fretboard__inlay"
                cx={cx}
                cy={cy1}
                r="6.5"
              />
              <circle
                className="tv-fretboard__inlay"
                cx={cx}
                cy={cy2}
                r="6.5"
              />
            </g>
          );
        })}

        {notes.map((n) => (
          <circle
            key={`noteCirc-${n.key}`}
            cx={n.cx}
            cy={n.cy}
            r={n.r}
            fill={n.fill}
            stroke={n.inChord ? "var(--fg)" : "none"}
            strokeWidth={n.isChordRoot ? 2.4 : n.inChord ? 1.8 : 0}
            onClick={(event) => {
              if (!onSelectNote) return;
              const noteName = nameForPc(n.pc);
              onSelectNote(n.pc, noteName, event);
            }}
            onContextMenu={(event) => {
              if (!onSelectNote) return;
              event.preventDefault();
              const noteName = nameForPc(n.pc);
              onSelectNote(n.pc, noteName, event);
            }}
          />
        ))}
      </g>

      {notes.map((n) => {
        if (!n.label) return null;
        return (
          <text
            key={`noteText-${n.key}`}
            className={clsx("tv-fretboard__note", {
              "tv-fretboard__note--root": n.isRoot,
            })}
            x={displayX(n.cx)}
            y={n.cy + 4}
            textAnchor="middle"
            onClick={(event) => {
              if (!onSelectNote) return;
              const noteName = nameForPc(n.pc);
              onSelectNote(n.pc, noteName, event);
            }}
            onContextMenu={(event) => {
              if (!onSelectNote) return;
              event.preventDefault();
              const noteName = nameForPc(n.pc);
              onSelectNote(n.pc, noteName, event);
            }}
          >
            {n.label}
          </text>
        );
      })}

      {showFretNums &&
        Array.from({ length: frets + 1 }).map((_, f) => {
          const labelNum = buildFretLabel(f, system.divisions, microLabelOpts);
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
              "tv-fretboard__marker--capo": f === capoFret,
              "tv-fretboard__marker--micro": !isStandard,
            }),
          };

          return (
            <text
              key={`num-${f}`}
              x={displayX(betweenFretsX(f))}
              y={isStandard ? bottomY : topY}
              textAnchor="middle"
              {...commonProps}
            >
              {labelNum}
            </text>
          );
        })}

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
    onSelectNote: p.onSelectNote,
  };
}

const FretboardMemo = memoWithPick(Fretboard, pickRenderProps);

export default FretboardMemo;
