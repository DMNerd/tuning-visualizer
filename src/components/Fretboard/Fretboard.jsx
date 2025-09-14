// src/components/Fretboard/Fretboard.jsx
import React, { forwardRef, useLayoutEffect, useRef } from "react";

import { useFretboardLayout } from "@/hooks/useFretboardLayout";
import { usePitchMapping } from "@/hooks/usePitchMapping";
import { useScaleAndChord } from "@/hooks/useScaleAndChord";
import { useInlays } from "@/hooks/useInlays";
import { useLabels } from "@/hooks/useLabels";
import { getDegreeColor } from "@/utils/degreeColors";

import { makeDisplayX } from "@/utils/displayX";
import { buildFretLabel } from "@/utils/fretLabels";

const Fretboard = forwardRef(function Fretboard(
  {
    strings = 6,
    frets = 22,
    tuning = ["E", "A", "D", "G", "B", "E"],
    rootIx = 0,
    intervals = [0, 2, 4, 5, 7, 9, 11],
    accidental = "sharp",
    show = "names", // 'names' | 'degrees' | 'intervals' | 'fret' | 'off'
    showOpen = true,
    showFretNums = true,
    dotSize = 14,
    lefty = false,
    system, // { divisions, nameForPc(pc, accidental?) }
    chordPCs = null, // Set<number> | null
    chordRootPc = null, // number | null
    openOnlyInScale = false,
    colorByDegree = false,
    hideNonChord = false,
    stringMeta = null, // per-string metadata (e.g., short 5th)
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

  const { pcForName, nameForPc } = usePitchMapping(system, accidental);

  const { scaleSet, degreeForPc } = useScaleAndChord({
    system,
    rootIx,
    intervals,
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

  if (!Array.isArray(intervals) || intervals.length === 0) {
    return (
      <svg
        ref={svgRef}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block" }}
      >
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
          No scale selected
        </text>
      </svg>
    );
  }

  const getMetaFor = (s) =>
    Array.isArray(stringMeta) ? stringMeta.find((m) => m.index === s) : null;

  return (
    <svg
      ref={svgRef}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block" }}
    >
      <g transform={lefty ? `scale(-1,1) translate(-${width},0)` : undefined}>
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx="14"
          fill="var(--panel)"
        />

        {/* nut */}
        <rect
          className="nut"
          x={padLeft}
          y={padTop - 8}
          width={nutW}
          height={height - padTop - padBottom + 16}
          rx="2"
        />

        {/* strings: optional grey pre-start stub + active segment */}
        {Array.from({ length: strings }).map((_, s) => {
          const y = yForString(s);
          const startX = stringStartX(s);
          const meta = getMetaFor(s);
          const hasGreyStub = !!meta?.greyBefore && startFretFor(s) > 0;

          return (
            <g key={`string-${s}`}>
              {hasGreyStub && (
                <line
                  x1={padLeft}
                  y1={y}
                  x2={startX}
                  y2={y}
                  className="stringLine greyBefore"
                />
              )}
              <line
                x1={startX}
                y1={y}
                x2={boardEndX}
                y2={y}
                className="stringLine"
              />
            </g>
          );
        })}

        {/* frets */}
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
              className={[
                "fretLine",
                isOctave ? "strong" : "",
                isStandard ? "standard" : "",
                isMicro ? "micro" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          );
        })}

        {/* center inlays (single) */}
        {inlaySingles.map((f) => {
          const prev = f === 1 ? 0 : fretXs[f - 2];
          const curr = fretXs[f - 1];
          const cx = padLeft + nutW + (prev + curr) / 2;
          const cy = padTop + (height - padTop - padBottom) / 2;
          return (
            <circle
              key={`inlay-s-${f}`}
              className="inlay"
              cx={cx}
              cy={cy}
              r="6.5"
            />
          );
        })}

        {/* double inlays at octaves */}
        {inlayDoubles.map((f) => {
          const prev = f === 1 ? 0 : fretXs[f - 2];
          const curr = fretXs[f - 1];
          const cx = padLeft + nutW + (prev + curr) / 2;
          const cy1 = padTop + (height - padTop - padBottom) / 2 - 14;
          const cy2 = padTop + (height - padTop - padBottom) / 2 + 14;
          return (
            <g key={`inlay-d-${f}`}>
              <circle className="inlay" cx={cx} cy={cy1} r="6.5" />
              <circle className="inlay" cx={cx} cy={cy2} r="6.5" />
            </g>
          );
        })}

        {/* note circles */}
        {tuning.map((openName, s) => {
          const openPc = pcForName(openName);
          const sf = startFretFor(s);
          return Array.from({ length: frets + 1 }).map((_, f) => {
            const isOpen = f === 0;

            // Open is always visible candidate; for short strings, globals 1..sf are skipped.
            const isPlayable = sf === 0 ? true : isOpen ? true : f > sf;
            if (!isPlayable) return null;

            const step = isOpen ? 0 : sf === 0 ? f : f - sf;
            const pc = (openPc + step) % system.divisions;

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
            if (!visible) return null;

            const cx = isOpen ? openXForString(s) : noteX(f, s);
            const cy = yForString(s);

            const isRoot = pc === rootIx;
            const isStandard = (f * 12) % system.divisions === 0;
            const isMicro = !isStandard;

            const rBase = (isRoot ? 1.1 : 1) * dotSize;
            const r = inChord ? rBase * 1.05 : rBase;

            let fill;
            if (colorByDegree) {
              const deg = degreeForPc(pc);
              if (deg != null) {
                fill = getDegreeColor(deg, intervals.length);
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

            return (
              <circle
                key={`noteCirc-${s}-${f}`}
                cx={cx}
                cy={cy}
                r={r}
                fill={fill}
                stroke={inChord ? "var(--fg)" : "none"}
                strokeWidth={isChordRoot ? 2.4 : inChord ? 1.8 : 0}
              />
            );
          });
        })}
      </g>

      {/* note labels */}
      {tuning.map((openName, s) => {
        const openPc = pcForName(openName);
        const sf = startFretFor(s);
        return Array.from({ length: frets + 1 }).map((_, f) => {
          const isOpen = f === 0;
          const isPlayable = sf === 0 ? true : isOpen ? true : f > sf;
          if (!isPlayable) return null;

          const step = isOpen ? 0 : sf === 0 ? f : f - sf;
          const pc = (openPc + step) % system.divisions;

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
          if (!visible) return null;

          const cx = isOpen ? openXForString(s) : noteX(f, s);
          const cy = yForString(s);
          const isRoot = pc === rootIx;

          // When "fret" mode is active, open uses the string's start fret number.
          const globalFretForLabel = isOpen ? sf : f;
          const raw = labelFor(pc, f);
          const label =
            show === "fret"
              ? buildFretLabel(globalFretForLabel, system.divisions)
              : raw;

          if (label === "") return null;

          return (
            <text
              key={`noteText-${s}-${f}`}
              className={`noteText ${isRoot ? "big" : ""}`}
              x={displayX(cx)}
              y={cy + 4}
              textAnchor="middle"
            >
              {label}
            </text>
          );
        });
      })}

      {/* fret numbers */}
      {showFretNums &&
        Array.from({ length: frets + 1 }).map((_, f) => {
          const labelNum = buildFretLabel(f, system.divisions);
          const bottomY = height - padBottom + FRETNUM_BOTTOM_GAP;
          const topY = padTop - FRETNUM_TOP_GAP;

          const isStandard = (f * 12) % system.divisions === 0;

          return isStandard ? (
            <text
              key={`num-${f}`}
              className="fretNum"
              x={displayX(betweenFretsX(f))}
              y={bottomY}
              textAnchor="middle"
            >
              {labelNum}
            </text>
          ) : (
            <text
              key={`num-${f}`}
              className="fretNum microNum"
              x={displayX(betweenFretsX(f))}
              y={topY}
              textAnchor="middle"
            >
              {labelNum}
            </text>
          );
        })}
    </svg>
  );
});

export default Fretboard;
