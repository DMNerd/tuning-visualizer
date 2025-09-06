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
    accidental = "sharp", // 'sharp' | 'flat'
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
    noteCenterX,
    yForString,
  } = useFretboardLayout({ frets, strings, dotSize });

  useLayoutEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.setAttribute("viewBox", `0 0 ${width} ${height}`);
    if (typeof ref === "function") ref(svgRef.current);
    else if (ref) ref.current = svgRef.current;
  }, [ref, width, height]);

  const displayX = makeDisplayX(lefty, width);

  const { pcForName, nameForPc } = usePitchMapping(system, accidental);

  // scale membership + degree lookup (chord context also passed)
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

  // ---------- Render ----------
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

        {/* strings */}
        {Array.from({ length: strings }).map((_, s) => (
          <line
            key={`string-${s}`}
            x1={padLeft}
            y1={yForString(s)}
            x2={boardEndX}
            y2={yForString(s)}
            className="stringLine"
          />
        ))}

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
          return Array.from({ length: frets + 1 }).map((_, f) => {
            const pc = (openPc + f) % system.divisions;
            const isOpen = f === 0;

            const inScale = scaleSet.has(pc);
            const inChord = chordPCs ? chordPCs.has(pc) : false;

            // Visibility rules
            let visible;
            if (hideNonChord && chordPCs) {
              // IGNORE scale & openOnlyInScale: show chord tones everywhere
              const baselineVisible = isOpen ? showOpen : true;
              visible = baselineVisible && inChord;
            } else {
              // regular scale-driven visibility
              const baselineVisible = isOpen
                ? showOpen && (!openOnlyInScale || inScale)
                : inScale;
              visible = baselineVisible;
            }

            if (!visible) return null;

            const cx = noteCenterX(f);
            const cy = yForString(s);

            const isRoot = pc === rootIx;
            const isChordRoot = inChord && chordRootPc === pc;
            const isStandard = (f * 12) % system.divisions === 0;
            const isMicro = !isStandard;

            const rBase = (isRoot ? 1.1 : 1) * dotSize;
            const r = inChord ? rBase * 1.05 : rBase;

            // Fill color (degree-first when enabled)
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
        return Array.from({ length: frets + 1 }).map((_, f) => {
          const pc = (openPc + f) % system.divisions;
          const isOpen = f === 0;

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

          const cx = noteCenterX(f);
          const cy = yForString(s);
          const isRoot = pc === rootIx;

          const raw = labelFor(pc, f);
          const label =
            show === "fret" ? buildFretLabel(f, system.divisions) : raw;

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
